package handlers

import (
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"strings"
	"vinventory/internal/socket"

	"github.com/gin-gonic/gin"
)

// TokenResponse represents the response containing the token
type TokenResponse struct {
	AccessToken string `json:"access_token"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error string `json:"error"`
}

// GetAllUsers godoc
// @Summary Get users from Microsoft Graph
// @Description Get users from Microsoft Graph using client credentials
// @Tags users
// @Accept  json
// @Produce  json
// @Success 200 {array} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/users [post]
func GetAllUsers() http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		token, err := GetAccessToken()
		if err != nil {
			context.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		usersURL := "https://graph.microsoft.com/v1.0/users"

		req, err := http.NewRequest("GET", usersURL, nil)
		if err != nil {
			context.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to create request"})
			return
		}

		req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))

		client := &http.Client{}
		resp, err := client.Do(req)
		if err != nil {
			context.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to make request"})
			return
		}
		defer func(Body io.ReadCloser) {
			err := Body.Close()
			if err != nil {
				log.Printf("failed to close response body: %v", err)
			}
		}(resp.Body)

		if resp.StatusCode != http.StatusOK {
			bodyBytes, _ := io.ReadAll(resp.Body)
			bodyString := string(bodyBytes)
			context.JSON(http.StatusInternalServerError, ErrorResponse{Error: fmt.Sprintf("Failed to fetch users: %s", bodyString)})
			return
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			context.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to read response body"})
			return
		}

		var users []map[string]interface{}
		var usersData map[string]interface{}
		if err := json.Unmarshal(body, &usersData); err != nil {
			context.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Failed to unmarshal response body"})
			return
		}

		// Extract and filter necessary properties from each user
		for _, user := range usersData["value"].([]interface{}) {
			u := user.(map[string]interface{})
			filteredUser := map[string]interface{}{
				"id":          u["id"],
				"firstName":   u["givenName"],
				"lastName":    u["surname"],
				"email":       u["mail"],
				"displayName": u["displayName"],
			}
			users = append(users, filteredUser)
		}

		// Return the filtered users data as JSON array
		context.JSON(http.StatusOK, users)
	})
}

// GetUserPhotoHandler godoc
// @Summary Get a user's photo from Microsoft Graph by ID
// @Description Get a user's photo from Microsoft Graph using client credentials and user ID
// @Tags users
// @Accept  json
// @Produce  json
// @Param id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/users/{id}/photo [get]
func GetUserPhotoHandler() http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		userID := context.Param("id")
		if userID == "" {
			context.JSON(http.StatusBadRequest, ErrorResponse{Error: "User ID parameter is required"})
			return
		}

		token, err := GetAccessToken()
		if err != nil {
			context.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		photoURL, err := GetUserPhotoURL(userID, token.AccessToken)
		if err != nil {
			context.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			return
		}

		context.JSON(http.StatusOK, map[string]string{"photoUrl": photoURL})
	})
}

// GetUserPhotoURL fetches the profile photo URL for a user by their ID
func GetUserPhotoURL(userID, accessToken string) (string, error) {
	photoURL := fmt.Sprintf("https://graph.microsoft.com/v1.0/users/%s/photo/$value", userID)

	req, err := http.NewRequest("GET", photoURL, nil)
	if err != nil {
		return "", fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", accessToken))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("failed to make request: %v", err)
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			log.Printf("failed to close response body: %v", err)
		}
	}(resp.Body)

	if resp.StatusCode != http.StatusOK {
		return "", nil // Return empty string if photo is not available
	}

	photoData, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", fmt.Errorf("failed to read response body: %v", err)
	}

	return fmt.Sprintf("data:image/jpeg;base64,%s", base64.StdEncoding.EncodeToString(photoData)), nil
}

// GetUserByID godoc
// @Summary Get a user from Microsoft Graph by ID
// @Description Get a user from Microsoft Graph using client credentials and user ID
// @Tags users
// @Accept  json
// @Produce  json
// @Param id path string true "User ID"
// @Success 200 {object} map[string]interface{}
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /auth/users/{id} [get]
func GetUserByIDHandler() http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		userID := context.Param("id")
		if userID == "" {
			context.JSON(http.StatusBadRequest, ErrorResponse{Error: "User ID parameter is required"})
			return
		}

		userData, err := GetUserByID(userID)
		if err != nil {
			if err.Error() == "User not found" {
				context.JSON(http.StatusNotFound, ErrorResponse{Error: err.Error()})
			} else {
				context.JSON(http.StatusInternalServerError, ErrorResponse{Error: err.Error()})
			}
			return
		}

		context.JSON(http.StatusOK, userData)
	})
}

// GetUserByID fetches a user by ID from Microsoft Graph
func GetUserByID(userID string) (map[string]interface{}, error) {
	token, err := GetAccessToken()
	if err != nil {
		return nil, fmt.Errorf("failed to get access token: %v", err)
	}

	userURL := fmt.Sprintf("https://graph.microsoft.com/v1.0/users/%s", userID)

	req, err := http.NewRequest("GET", userURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %v", err)
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %v", err)
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			log.Printf("failed to close response body: %v", err)
		}
	}(resp.Body)

	if resp.StatusCode == http.StatusNotFound {
		return nil, fmt.Errorf("user not found")
	} else if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		bodyString := string(bodyBytes)
		return nil, fmt.Errorf("failed to fetch user: %s", bodyString)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %v", err)
	}

	var userData map[string]interface{}
	if err := json.Unmarshal(body, &userData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response body: %v", err)
	}

	// Filter properties to return only id, firstName, lastName, mail
	filteredUserData := map[string]interface{}{
		"id":          userData["id"],
		"firstName":   userData["givenName"],
		"lastName":    userData["surname"],
		"email":       userData["mail"],
		"displayName": userData["displayName"],
	}

	return filteredUserData, nil
}

func GetAccessToken() (TokenResponse, error) {
	tenantID := url.QueryEscape(os.Getenv("AZURE_TENANT_ID"))
	tokenUrl := fmt.Sprintf("https://login.microsoftonline.com/%s/oauth2/v2.0/token", tenantID)
	data := url.Values{}
	data.Set("client_id", os.Getenv("AZURE_CLIENT_ID"))
	data.Set("scope", "https://graph.microsoft.com/.default")
	data.Set("client_secret", os.Getenv("AZURE_CLIENT_SECRET"))
	data.Set("grant_type", "client_credentials")

	req, err := http.NewRequest("POST", tokenUrl, strings.NewReader(data.Encode()))
	if err != nil {
		return TokenResponse{}, fmt.Errorf("failed to create new request: %w", err)
	}
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")

	res, err := http.DefaultClient.Do(req)
	if err != nil {
		return TokenResponse{}, fmt.Errorf("failed to perform HTTP request: %w", err)
	}
	defer func() {
		if closeErr := res.Body.Close(); closeErr != nil {
			log.Printf("failed to close response body: %v", closeErr)
		}
	}()

	if res.StatusCode != http.StatusOK {
		bodyBytes, readErr := io.ReadAll(res.Body)
		if readErr != nil {
			return TokenResponse{}, fmt.Errorf("failed to read response body: %w", readErr)
		}
		bodyString := string(bodyBytes)
		return TokenResponse{}, fmt.Errorf("received non-200 response status: %d, response: %s", res.StatusCode, bodyString)
	}

	var response TokenResponse
	if err := json.NewDecoder(res.Body).Decode(&response); err != nil {
		return TokenResponse{}, fmt.Errorf("failed to decode response body: %w", err)
	}

	return response, nil
}
