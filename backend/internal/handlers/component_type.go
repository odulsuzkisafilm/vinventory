package handlers

import (
	"github.com/gin-gonic/gin"
	"github.com/lib/pq"
	gormpkg "gorm.io/gorm"
	"net/http"
	"strconv"
	"vinventory/internal/models"
	"vinventory/internal/socket"
)

// GetComponentTypes godoc
// @Summary Get all component types
// @Description Get details of all component types
// @Tags types
// @Accept  json
// @Produce  json
// @Success 200 {array} models.ComponentType
// @Router /types [get].
func GetComponentTypes(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		var types []models.ComponentType

		if err := database.Find(&types).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Convert Attributes to AttributesList for each component type
		for i := range types {
			types[i].AttributesList = types[i].Attributes
		}

		context.JSON(http.StatusOK, types)
	})
}

// GetComponentTypeByID godoc
// @Summary Get a specific component type
// @Description Get details of a specific component type
// @Tags types
// @Accept  json
// @Produce  json
// @Param id path int true "Component Type ID"
// @Success 200 {object} models.ComponentType
// @Router /types/{id} [get]
func GetComponentTypeByID(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		id := context.Param("id")

		var componentType models.ComponentType
		if err := database.First(&componentType, id).Error; err != nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "Component type not found"})
			return
		}

		// Convert Attributes to AttributesList for the response
		componentType.AttributesList = componentType.Attributes

		context.JSON(http.StatusOK, componentType)
	})
}

// CreateComponentType godoc
// @Summary Create a new component type
// @Description Create a new component type with the input payload
// @Tags types
// @Accept  json
// @Produce  json
// @Param component_type body models.ComponentType true "Component Type"
// @Success 201 {object} models.ComponentType
// @Router /types [post]
func CreateComponentType(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		var componentType models.ComponentType
		if err := context.ShouldBindJSON(&componentType); err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Convert AttributesList to Attributes
		componentType.Attributes = pq.StringArray(componentType.AttributesList)
		requiredAttributes := []string{"warrantyEndDate", "serialNumber"}
		componentType.Attributes = append(componentType.Attributes, requiredAttributes...)

		if err := database.Create(&componentType).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Convert Attributes to AttributesList for the response
		componentType.AttributesList = componentType.Attributes

		context.JSON(http.StatusCreated, componentType)
	})
}

// DeleteComponentType godoc
// @Summary Delete a component type
// @Description Delete a component type (only if no components are using this type)
// @Tags types
// @Accept  json
// @Produce  json
// @Param id path int true "Type ID"
// @Success 204
// @Router /types/{id} [delete].
func DeleteComponentType(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		idStr := context.Param("id")
		if idStr == "" {
			context.JSON(http.StatusBadRequest, gin.H{"error": "ID parameter is missing"})
			return
		}

		id, err := strconv.Atoi(idStr)
		if err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": "Invalid component type ID: " + idStr})
			return
		}

		// Check if any components are using this type
		var componentCount int64
		if err := database.Model(&models.Component{}).Where("type_id = ?", id).Count(&componentCount).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": "Error checking related components: " + err.Error()})
			return
		}

		if componentCount > 0 {
			context.JSON(http.StatusBadRequest, gin.H{"error": "Cannot delete component type; it is referenced by components"})
			return
		}

		// Delete the component type
		if err := database.Delete(&models.ComponentType{}, id).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": "Error deleting component type: " + err.Error()})
			return
		}

		context.Status(http.StatusNoContent)
	})
}

// UpdateComponentType godoc
// @Summary Update an existing component type
// @Description Update an existing component type
// @Tags types
// @Accept  json
// @Produce  json
// @Param id path int true "Type ID"
// @Param type body models.ComponentType true "Component Type"
// @Success 200 {object} models.ComponentType
// @Router /types/{id} [put].
func UpdateComponentType(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		idStr := context.Param("id")
		if idStr == "" {
			context.JSON(http.StatusBadRequest, gin.H{"error": "ID parameter is missing"})
			return
		}

		id, err := strconv.Atoi(idStr)
		if err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": "Invalid component type ID: " + idStr})
			return
		}

		var componentType models.ComponentType

		if err := database.First(&componentType, id).Error; err != nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "Component type not found for ID: " + idStr})
			return
		}

		var input models.ComponentType
		if err := context.ShouldBindJSON(&input); err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": "Error binding JSON: " + err.Error()})
			return
		}

		componentType.Name = input.Name
		componentType.Attributes = pq.StringArray(input.AttributesList)

		if err := database.Save(&componentType).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": "Error saving to database: " + err.Error()})
			return
		}
		componentType.AttributesList = componentType.Attributes

		context.JSON(http.StatusOK, componentType)
	})
}
