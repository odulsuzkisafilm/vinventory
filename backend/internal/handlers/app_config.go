package handlers

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"vinventory/internal/socket"
)

type Config struct {
	TenantID string `json:"tenantId"`
	ClientID string `json:"clientId"`
}

// GetConfigHandler handles the config endpoint
// @Summary Get configuration
// @Description Get Azure AD configuration for the Web App
// @Tags config
// @Produce json
// @Success 200 {object} Config
// @Router /config [get]
func GetConfigHandler() http.HandlerFunc {
	return socket.GinHandlerToMux(func(c *gin.Context) {
		config := Config{
			TenantID: os.Getenv("AZURE_TENANT_ID"),
			ClientID: os.Getenv("AZURE_CLIENT_ID"),
		}

		c.JSON(http.StatusOK, config)
	})
}
