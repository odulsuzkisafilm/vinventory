package handlers

import (
	"net/http"
	"vinventory/internal/socket"

	"vinventory/internal/models"

	"github.com/gin-gonic/gin"
	gormpkg "gorm.io/gorm"
)

// GetUserInventoryHistory godoc
// @Summary Get all inventory history for a specific user
// @Description Get all inventory history for a specific user by user ID
// @Tags users
// @Accept  json
// @Produce  json
// @Param id path int true "User ID"
// @Success 200 {array} models.InventoryHistory
// @Router /users/{id}/inventory-history [get]
func GetUserInventoryHistory(database *gormpkg.DB) http.HandlerFunc {
	return socket.GinHandlerToMux(func(context *gin.Context) {
		id := context.Param("id")

		// Validate that the user exists
		user, err := GetAUserByIDMid(id)
		if err != nil || user == nil {
			context.JSON(http.StatusNotFound, gin.H{"error": "User not found from API"})
			return
		}

		// Retrieve the inventory history for the user
		var history []models.InventoryHistory
		if err := database.Where("user_id = ?", id).Find(&history).Error; err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}

		context.JSON(http.StatusOK, history)
	})
}
