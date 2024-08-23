package handlers

import (
	"errors"
	"fmt"
	"github.com/gin-gonic/gin"
	minio_ "github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"mime/multipart"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"time"
	"vinventory/internal/config"
	"vinventory/internal/socket"
)

type ImageResponse struct {
	Images []string `json:"images"`
}

type SuccessResponse struct {
	Message string `json:"message"`
}

var minioClient *minio_.Client

func init() {
	minioConfig := config.ConfigMinio()

	var err error
	minioClient, err = minio_.New(minioConfig.MinioEndpoint, &minio_.Options{
		Creds:  credentials.NewStaticV4(minioConfig.MinioAccessKey, minioConfig.MinioSecretKey, ""),
		Secure: minioConfig.MinioUseSSL == true,
	})
	if err != nil {
		panic(err)
	}
}

// AddComponentImages godoc
// @Summary Upload images for a component
// @Description Upload multiple images for a specified component
// @Tags components
// @Accept  multipart/form-data
// @Produce  json
// @Param id path string true "Component ID"
// @Param image formData file true "Image files to upload"
// @Success 200 {object} SuccessResponse
// @Failure 400 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /components/{id}/image [post]
func AddComponentImages() http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		// Read the limit from an environment variable
		uploadLimitMiBStr := os.Getenv("UPLOAD_LIMIT_MIB")
		if uploadLimitMiBStr == "" {
			uploadLimitMiBStr = "10" // Default to 10 MiB
		}
		uploadLimitMiB, err := strconv.ParseInt(uploadLimitMiBStr, 10, 64)
		if err != nil {
			context.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Invalid upload limit configuration"})
			return
		}

		err = context.Request.ParseMultipartForm(uploadLimitMiB << 20)
		if err != nil {
			var errorMsg string
			if errors.Is(err, http.ErrNotMultipart) {
				errorMsg = "The request content type is not multipart/form-data"
			} else if errors.Is(err, http.ErrMissingBoundary) {
				errorMsg = "The multipart form boundary is missing"
			} else {
				errorMsg = fmt.Sprintf("Error parsing multipart form: %v", err)
			}
			context.JSON(http.StatusBadRequest, ErrorResponse{Error: errorMsg})
			return
		}

		componentID := context.Param("id")
		if componentID == "" {
			context.JSON(http.StatusBadRequest, ErrorResponse{Error: "Component ID is required"})
			return
		}

		formdata := context.Request.MultipartForm
		files := formdata.File["image"]
		if len(files) == 0 {
			context.JSON(http.StatusBadRequest, ErrorResponse{Error: "No files uploaded"})
			return
		}

		bucketName := os.Getenv("MINIO_BUCKET")
		if bucketName == "" {
			bucketName = "vinventory" // Default bucket
		}

		for _, fileHeader := range files {
			file, err := fileHeader.Open()
			if err != nil {
				context.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Unable to open file"})
				return
			}
			defer func(file multipart.File) {
				err := file.Close()
				if err != nil {
					return
				}
			}(file)

			objectName := fmt.Sprintf("%s/%d_%s", componentID, time.Now().Unix(), fileHeader.Filename)
			_, err = minioClient.PutObject(context.Request.Context(), bucketName, objectName, file, fileHeader.Size, minio_.PutObjectOptions{ContentType: fileHeader.Header.Get("Content-Type")})
			if err != nil {
				context.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Unable to save file"})
				return
			}
		}

		context.JSON(http.StatusOK, SuccessResponse{Message: "Images uploaded successfully"})
	})
}

// GetComponentImages godoc
// @Summary Get images for a component
// @Description Retrieve a list of image URLs for a specified component using pre-signed URLs
// @Tags components
// @Accept  json
// @Produce  json
// @Param id path string true "Component ID"
// @Success 200 {object} ImageResponse
// @Failure 400 {object} ErrorResponse
// @Failure 404 {object} ErrorResponse
// @Failure 500 {object} ErrorResponse
// @Router /components/{id}/image [get]
func GetComponentImages() http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		componentID := context.Param("id")
		if componentID == "" {
			context.JSON(http.StatusBadRequest, ErrorResponse{Error: "Component ID is required"})
			return
		}

		bucketName := os.Getenv("MINIO_BUCKET")
		if bucketName == "" {
			bucketName = "vinventory" // Default bucket
		}

		images := make([]string, 0)

		objectCh := minioClient.ListObjects(context.Request.Context(), bucketName, minio_.ListObjectsOptions{
			Prefix:    componentID + "/",
			Recursive: true,
		})

		for object := range objectCh {
			if object.Err != nil {
				context.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Unable to list images"})
				return
			}

			// Generating pre-signed URL for each image
			reqParams := make(url.Values)
			presignedURL, err := minioClient.PresignedGetObject(context.Request.Context(), bucketName, object.Key, time.Hour*24, reqParams)
			if err != nil {
				context.JSON(http.StatusInternalServerError, ErrorResponse{Error: "Unable to generate pre-signed URL"})
				return
			}

			images = append(images, presignedURL.String())
		}

		context.JSON(http.StatusOK, ImageResponse{Images: images})
	})
}
