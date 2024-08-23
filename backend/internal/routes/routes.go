package routes

import (
	"net/http"
	"vinventory/internal/handlers"
	"vinventory/internal/middleware"

	"github.com/gorilla/mux"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	httpSwagger "github.com/swaggo/http-swagger"
	"gorm.io/gorm"
)

// SetupRouter initializes the API routes and returns the router
func SetupRouter(db *gorm.DB) *mux.Router {
	router := mux.NewRouter()

	// Swagger endpoint
	router.PathPrefix("/swagger/").Handler(httpSwagger.WrapHandler)

	// Health and Readiness endpoints
	router.HandleFunc("/health", handlers.LivenessCheckHandler).Methods(http.MethodGet)
	router.HandleFunc("/readiness", handlers.ReadinessCheckHandler(db)).Methods(http.MethodGet)

	// API Version 1 routes
	apiV1 := router.PathPrefix("/api/v1").Subrouter()

	// Config route
	apiV1.Handle("/config", handlers.GetConfigHandler()).Methods(http.MethodGet)

	// Components routes (Protected)
	apiV1.Handle("/components", middleware.AuthMiddleware(handlers.GetComponents(db))).Methods(http.MethodGet)
	apiV1.Handle("/components/{id}", middleware.AuthMiddleware(handlers.GetComponentByID(db))).Methods(http.MethodGet)
	apiV1.Handle("/components", middleware.AuthMiddleware(handlers.CreateComponent(db))).Methods(http.MethodPost)
	apiV1.Handle("/components/{id}", middleware.AuthMiddleware(handlers.UpdateComponent(db))).Methods(http.MethodPut)
	apiV1.Handle("/components/{id}/deactivate/{userID}", middleware.AuthMiddleware(handlers.DeactivateComponent(db))).Methods(http.MethodPut)
	apiV1.Handle("/components/{id}/activate/{userID}", middleware.AuthMiddleware(handlers.ActivateComponent(db))).Methods(http.MethodPut)
	apiV1.Handle("/components/{id}/last-interactant", middleware.AuthMiddleware(handlers.GetLastInteractant(db))).Methods(http.MethodGet)
	apiV1.Handle("/components/{id}/inventory-history", middleware.AuthMiddleware(handlers.GetInventoryHistoryByComponentID(db))).Methods(http.MethodGet)
	apiV1.Handle("/components/{attribute}/uniquevalue", middleware.AuthMiddleware(handlers.GetAttributeValues(db))).Methods(http.MethodGet)
	apiV1.Handle("/components/{id}/image", middleware.AuthMiddleware(handlers.GetComponentImages())).Methods(http.MethodGet)
	apiV1.Handle("/components/{id}/image", middleware.AuthMiddleware(handlers.AddComponentImages())).Methods(http.MethodPost)

	// Component Types routes (Protected)
	apiV1.Handle("/types", middleware.AuthMiddleware(handlers.GetComponentTypes(db))).Methods(http.MethodGet)
	apiV1.Handle("/types/{id}", middleware.AuthMiddleware(handlers.GetComponentTypeByID(db))).Methods(http.MethodGet)
	apiV1.Handle("/types", middleware.AuthMiddleware(handlers.CreateComponentType(db))).Methods(http.MethodPost)
	apiV1.Handle("/types/{id}", middleware.AuthMiddleware(handlers.UpdateComponentType(db))).Methods(http.MethodPut)
	apiV1.Handle("/types/{id}", middleware.AuthMiddleware(handlers.DeleteComponentType(db))).Methods(http.MethodDelete)

	// User routes (Protected)
	apiV1.Handle("/users/{id}/inventory-history", middleware.AuthMiddleware(handlers.GetUserInventoryHistory(db))).Methods(http.MethodGet)

	// Auth routes (Protected)
	apiV1.Handle("/auth/users", middleware.AuthMiddleware(handlers.GetAllUsers())).Methods(http.MethodPost)
	apiV1.Handle("/auth/users/{id}", middleware.AuthMiddleware(handlers.GetUserByIDHandler())).Methods(http.MethodGet)
	apiV1.Handle("/auth/users/{id}/photo", middleware.AuthMiddleware(handlers.GetUserPhotoHandler())).Methods(http.MethodGet)

	// Inventory History routes (Protected)
	apiV1.Handle("/inventory-history", middleware.AuthMiddleware(handlers.CreateInventoryHistory(db))).Methods(http.MethodPost)

	//Prometheus
	apiV1.Handle("/metrics", promhttp.Handler()).Methods(http.MethodGet)

	return router
}
