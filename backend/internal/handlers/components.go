package handlers

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"strings"
	"time"

	"vinventory/internal/models"
	"vinventory/internal/socket"

	"github.com/gin-gonic/gin"
	gormpkg "gorm.io/gorm"
)

// GetComponents godoc
// @Summary Get details of all component items with optional search, filters, and sorting
// @Description If no query parameter is passed api gets all components, search query parameter searchs
// for components that contains the given string in their bran, model, serial number attribute or current user.
// also attributes like status, brand, type, model_year, screen_size, processor_type, processor_cores, ram, serial_number, condition
// can be passed as query parameters to filter. sort query parameter can be passed to sort the results according to specific attribute
// @Tags components
// @Accept  json
// @Produce  json
// @Param search query string false "Search term"
// @Param status query string false "Status of the component"
// @Param brand query string false "Brand of the component"
// @Param type query string false "Type ID of the component"
// @Param model_year query int false "Model year of the component"
// @Param screen_size query string false "Screen size of the component"
// @Param processor_type query string false "Processor type of the component"
// @Param processor_cores query int false "Number of processor cores"
// @Param ram query int false "RAM size of the component"
// @Param serial_number query string false "Serial number of the component"
// @Param condition query string false "Condition of the component"
// @Param sort query string false "Field to sort by"
// @Param order query string false "Order direction (asc/desc)"
// @Success 200 {array} models.Component
// @Router /components [get]
func fetchUsers() (map[string]models.User, error) {
	token, err := GetAccessToken()
	if err != nil {
		return nil, err
	}

	usersURL := "https://graph.microsoft.com/v1.0/users"
	req, err := http.NewRequest("GET", usersURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	req.Header.Add("Authorization", fmt.Sprintf("Bearer %s", token.AccessToken))

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		bodyString := string(bodyBytes)
		return nil, fmt.Errorf("failed to fetch users: %s", bodyString)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	var usersData map[string]interface{}
	if err := json.Unmarshal(body, &usersData); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response body: %w", err)
	}

	userMap := make(map[string]models.User)
	for _, user := range usersData["value"].([]interface{}) {
		u := user.(map[string]interface{})
		id, _ := u["id"].(string)
		displayName, _ := u["displayName"].(string)
		email, _ := u["mail"].(string)
		filteredUser := models.User{
			ID:          id,
			DisplayName: displayName,
			Email:       email,
		}
		userMap[id] = filteredUser
	}

	return userMap, nil
}

func GetComponents(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		var components []models.Component
		query := database.Model(&models.Component{})

		// Filtering
		if status := context.Query("status"); status != "" {
			query = query.Where("status = ?", status)
		}
		if brand := context.Query("brand"); brand != "" {
			query = query.Where("brand = ?", brand)
		}
		if typeID := context.Query("type_id"); typeID != "" {
			query = query.Where("type_id = ?", typeID)
		}
		if modelYear := context.Query("model_year"); modelYear != "" {
			query = query.Where("model_year = ?", modelYear)
		}
		if screenSize := context.Query("screen_size"); screenSize != "" {
			query = query.Where("screen_size = ?", screenSize)
		}
		if processorType := context.Query("processor_type"); processorType != "" {
			query = query.Where("processor_type = ?", processorType)
		}
		if processorCores := context.Query("processor_cores"); processorCores != "" {
			query = query.Where("processor_cores = ?", processorCores)
		}
		if ram := context.Query("ram"); ram != "" {
			query = query.Where("ram = ?", ram)
		}
		if serialNumber := context.Query("serial_number"); serialNumber != "" {
			query = query.Where("serial_number = ?", serialNumber)
		}
		if condition := context.Query("condition"); condition != "" {
			query = query.Where("condition = ?", condition)
		}

		// Fetch user data
		userMap, err := fetchUsers()
		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Search
		searchString := context.Query("search")
		if searchString != "" {
			searchPattern := "%" + searchString + "%"
			userIDs := getUserIDs(userMap, searchString)

			subQuery := database.Table("(?) as ih", database.Model(&models.InventoryHistory{}).
				Select("DISTINCT ON (component_id) *").
				Order("component_id, created_at DESC"))

			query = query.Joins("LEFT JOIN (?) as last_ih ON components.id = last_ih.component_id", subQuery).
				Where("components.brand ILIKE ? OR components.model ILIKE ? OR components.serial_number ILIKE ? OR (components.status = 'Being Used' AND last_ih.user_id IN (?))",
					searchPattern, searchPattern, searchPattern, userIDs)
		}

		// Sorting
		sort := context.Query("sort")
		order := context.Query("order")
		if sort != "" {
			if order != "desc" {
				order = "asc"
			}
			query = query.Order(sort + " " + order)
		}

		// Fetch the results
		if err := query.Distinct("components.*").Find(&components).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		context.JSON(http.StatusOK, components)
	})
}

// getUserIDs returns a slice of user IDs whose display name matches the search pattern
func getUserIDs(userMap map[string]models.User, searchPattern string) []string {
	var userIDs []string
	lowerPattern := strings.ToLower(searchPattern)
	for _, user := range userMap {
		displayName := strings.ToLower(user.DisplayName)
		if strings.Contains(displayName, lowerPattern) {
			userIDs = append(userIDs, user.ID)
			log.Println(displayName)
			log.Println(user.DisplayName)
			log.Println(user.ID)
		}
	}
	uniqueUserIDs := make([]string, 0, len(userIDs))
	userIDMap := make(map[string]bool)
	for _, id := range userIDs {
		if !userIDMap[id] {
			uniqueUserIDs = append(uniqueUserIDs, id)
			userIDMap[id] = true
		}
	}
	return uniqueUserIDs
}

// GetComponentByID godoc
// @Summary Get a specific component item
// @Description Get details of a specific component item
// @Tags components
// @Accept  json
// @Produce  json
// @Param id path int true "Component ID"
// @Success 200 {object} models.Component
// @Router /components/{id} [get]
func GetComponentByID(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		id := context.Param("id")

		var component models.Component
		if err := database.First(&component, id).Error; err != nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})

			return
		}

		context.JSON(http.StatusOK, component)
	})
}

// ComponentRequest represents the request payload for creating a component
type ComponentRequest struct {
	Component models.Component `json:"component"`
	UserID    string           `json:"userId"`
}

// CreateComponent godoc
// @Summary Create a new component item
// @Description Create a new component item with the input payload
// @Tags components
// @Accept  json
// @Produce  json
// @Param componentRequest body ComponentRequest true "Component Request"
// @Success 201 {object} models.Component
// @Router /components [post]
func CreateComponent(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		var request ComponentRequest
		if err := context.ShouldBindJSON(&request); err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		component := request.Component
		userID := request.UserID

		// Ensure the status is set
		if component.Status == "" {
			component.Status = "Ready to Use"
		}

		// Ensure the type_id exists
		var componentType models.ComponentType
		if err := database.First(&componentType, component.TypeID).Error; err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type_id"})
			return
		}

		// Create the component
		if err := database.Create(&component).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Create an inventory history entry
		inventoryHistory := models.InventoryHistory{
			ComponentID:   component.ID,
			UserID:        userID,
			OperationType: "Added",
			CreatedAt:     time.Now(),
		}

		user, err := GetAUserByIDMid(userID)
		if err != nil || user == nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "User not found from API."})
			return
		}

		// Add the username info for the case of user deletion
		userData := user.(map[string]interface{})
		userName := fmt.Sprintf("%s %s", userData["firstName"], userData["lastName"])

		inventoryHistory.UserName = userName

		if err := database.Create(&inventoryHistory).Error; err != nil {
			log.Printf("Error creating inventory history: %v", err)
			context.JSON(http.StatusInternalServerError, gin.H{"error": err})
			return
		}

		context.JSON(http.StatusCreated, component)
	})
}

// UpdateComponent godoc
// @Summary Update an existing component item
// @Description Update an existing component item
// @Tags components
// @Accept  json
// @Produce  json
// @Param id path int true "Component ID"
// @Param component body models.Component true "Component Item"
// @Success 200 {object} models.Component
// @Router /components/{id} [put]
func UpdateComponent(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		id := context.Param("id")

		var component models.Component
		if err := database.First(&component, id).Error; err != nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
			return
		}

		var input models.Component
		if err := context.ShouldBindJSON(&input); err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Ensure the type_id exists
		var componentType models.ComponentType
		if err := database.First(&componentType, input.TypeID).Error; err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": "Invalid type_id"})
			return
		}

		if component.WarrantyEndDate != input.WarrantyEndDate {
			component.EmailNotified = false
		}

		component.Status = input.Status
		component.Brand = input.Brand
		component.Model = input.Model
		component.ModelYear = input.ModelYear
		component.TypeID = input.TypeID
		component.ScreenSize = input.ScreenSize
		component.Resolution = input.Resolution
		component.ProcessorType = input.ProcessorType
		component.ProcessorCores = input.ProcessorCores
		component.RAM = input.RAM
		component.WarrantyEndDate = input.WarrantyEndDate
		component.SerialNumber = input.SerialNumber
		component.Condition = input.Condition
		component.Notes = input.Notes

		if err := database.Save(&component).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		context.JSON(http.StatusOK, component)
	})
}

// DeactivateComponent godoc
// @Summary Deactivate a component item
// @Description Mark a component item as inactive (change status to "Out of Inventory")
// @Tags components
// @Accept  json
// @Produce  json
// @Param id path int true "Component ID"
// @Success 204
// @Router /components/{id}/deactivate/{userID} [put]
func DeactivateComponent(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		id := context.Param("id")
		userID := context.Param("userID")

		var component models.Component
		if err := database.First(&component, id).Error; err != nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
			return
		}

		component.Status = "Out of Inventory"

		if err := database.Save(&component).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Create the inventory history entry
		history := models.InventoryHistory{
			ComponentID:   component.ID,
			OperationType: "Deactivated",
			UserID:        userID,     // Assumes the userID is stored in the context, adjust as needed
			CreatedAt:     time.Now(), // Use the appropriate timestamp format
		}

		if err := database.Create(&history).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		context.Status(http.StatusNoContent)
	})
}

// ActivateComponent godoc
// @Summary Activate a component item
// @Description Mark a component item as active if it is inactive (change status to "Ready to Use")
// @Tags components
// @Accept  json
// @Produce  json
// @Param id path int true "Component ID"
// @Success 204
// @Router /components/{id}/activate/{userID} [put]
func ActivateComponent(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		id := context.Param("id")
		userID := context.Param("userID")

		var component models.Component
		if err := database.First(&component, id).Error; err != nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
			return
		}

		component.Status = "Ready to Use"

		if err := database.Save(&component).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Create the inventory history entry
		history := models.InventoryHistory{
			ComponentID:   component.ID,
			OperationType: "Activated",
			UserID:        userID,     // Assumes the userID is stored in the context, adjust as needed
			CreatedAt:     time.Now(), // Use the appropriate timestamp format
		}

		if err := database.Create(&history).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		context.Status(http.StatusNoContent)
	})
}

// GetAUserByIDMid fetches a user by ID from Microsoft Graph directly
func GetAUserByIDMid(userID string) (interface{}, error) {
	userData, err := GetUserByID(userID)
	if err != nil {
		return nil, err
	}
	return userData, nil
}

// GetLastInteractant godoc
// @Summary Gets the last interactant user and the component's status
// @Description Given a component ID, returns the last interactant user and the component's status
// @Tags components
// @Accept  json
// @Produce  json
// @Param id path int true "Component ID"
// @Success 200 {object} map[string]interface{}
// @Router /components/{id}/last-interactant [get]
func GetLastInteractant(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		componentID := context.Param("id")

		var component models.Component
		if err := database.First(&component, componentID).Error; err != nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
			return
		}

		var lastHistory models.InventoryHistory
		if err := database.Where("component_id = ?", componentID).Order("created_at desc").First(&lastHistory).Error; err != nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "No interaction found for this component"})
			return
		}

		// Fetch the user from our API using GetUserByID
		userID := lastHistory.UserID
		user, err := GetAUserByIDMid(userID)
		if err != nil {
			user = map[string]interface{}{
				"id":          nil,
				"firstName":   nil,
				"lastName":    nil,
				"email":       nil,
				"displayName": lastHistory.UserName,
			}
		}

		response := map[string]interface{}{
			"lastInteractantUser": user,
			"componentStatus":     component.Status,
		}

		context.JSON(http.StatusOK, response)
	})
}

// GetInventoryHistoryByComponentID godoc
// @Summary Get inventory history of a specific component
// @Description Get details of the inventory history of a specific component
// @Tags inventory-history
// @Accept  json
// @Produce  json
// @Param id path int true "Component ID"
// @Success 200 {array} models.InventoryHistory
// @Router /components/{id}/inventory-history [get]
func GetInventoryHistoryByComponentID(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		componentID := context.Param("id")

		var history []models.InventoryHistory
		if err := database.Where("component_id = ?", componentID).Find(&history).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		context.JSON(http.StatusOK, history)
	})
}

func GetAttributeValues(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		attribute := context.Param("attribute")
		var values []interface{}

		if attribute == "" {
			context.JSON(http.StatusBadRequest, gin.H{"error": "Attribute parameter is required"})
			return
		}

		query := database.Model(&models.Component{}).
			Distinct(attribute).
			Where(attribute+" IS NOT NULL").
			Order(attribute+" ASC").
			Pluck(attribute, &values)

		if err := query.Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve distinct values"})
			return
		}

		if len(values) > 0 {
			switch values[0].(type) {
			case string:
				var stringValues []string
				for _, v := range values {
					if v != nil { // Check for nil values
						stringValues = append(stringValues, v.(string))
					}
				}
				context.JSON(http.StatusOK, stringValues)
			case int:
				var intValues []int
				for _, v := range values {
					if v != nil { // Check for nil values
						intValues = append(intValues, v.(int))
					}
				}
				context.JSON(http.StatusOK, intValues)
			default:
				context.JSON(http.StatusOK, values)
			}
		} else {
			context.JSON(http.StatusOK, values)
		}
	})
}
