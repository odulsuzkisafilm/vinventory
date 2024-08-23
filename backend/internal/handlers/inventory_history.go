package handlers

import (
	"fmt"
	"net/http"
	"vinventory/internal/socket"

	"vinventory/internal/models"

	"github.com/gin-gonic/gin"
	gormpkg "gorm.io/gorm"
)

// CreateInventoryHistory godoc
// @Summary Create a new inventory history entry
// @Description Create a new inventory history entry with the input payload
// @Tags inventory-history
// @Accept json
// @Produce json
// @Param inventory_history body models.InventoryHistory true "Inventory History"
// @Success 201 {object} models.InventoryHistory
// @Router /inventory-history [post]
func CreateInventoryHistory(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		var history models.InventoryHistory
		if err := context.ShouldBindJSON(&history); err != nil {
			context.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}

		// Validate that ComponentID and UserID exist
		var component models.Component
		if err := database.First(&component, "id = ?", history.ComponentID).Error; err != nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "Component not found"})
			return
		}

		// Fetch the user from our API using GetUserByID
		userID := history.UserID
		user, err := GetAUserByIDMid(userID)
		if err != nil || user == nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "User not found from API."})
			return
		}

		// Add the username info for the case of user deletion
		userData := user.(map[string]interface{})
		userName := fmt.Sprintf("%s %s", userData["firstName"], userData["lastName"])

		history.UserName = userName

		// Update the component's status based on the operation type
		switch history.OperationType {
		case "Assigned":
			component.Status = "Being Used"
		case "Returned":
			component.Status = "Ready to Use"
		case "Added":
			component.Status = "Ready to Use"
		default:
			context.JSON(http.StatusBadRequest, gin.H{"error": "Invalid operation type"})
			return
		}

		// Save the updated component status
		if err := database.Save(&component).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		// Create the new inventory history entry
		if err := database.Create(&history).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		context.JSON(http.StatusCreated, history)
	})
}
