package main

import (
	"log"
	"net/http"
	"os"
	"time"
	_ "vinventory/docs" // Swagger docs
	"vinventory/internal/config"
	"vinventory/internal/middleware"
	email "vinventory/internal/notifications"
	"vinventory/internal/routes"
)

// @title Vinventory API
// @version 1.0
// @description This is a sample server for managing virtual inventory.
// @termsOfService http://swagger.io/terms/

// @contact.name API Support
// @contact.url http://www.swagger.io/support
// @contact.email support@swagger.io

// @license.name Apache 2.0
// @license.url http://www.apache.org/licenses/LICENSE-2.0.html

// @host localhost:8080
// @BasePath /api/v1
func recordMetrics() {
	go func() {
		for {
			middleware.IncrementOpsProcessed()
			middleware.TrackMemoryUsage()
			time.Sleep(2 * time.Second)
		}
	}()
}

func main() {
	cfg := config.LoadConfig()

	database, err := config.InitDatabase(cfg)
	if err != nil {
		log.Fatal(err)
	}

	if len(os.Args) > 1 && os.Args[1] == "notification_job" {
		email.NotifyExpiringWarranties(database, cfg)
	} else {
		recordMetrics()

		// Set up the router
		router := routes.SetupRouter(database)

		// Apply middlewares
		router.Use(middleware.RequestCounterMiddleware)
		router.Use(middleware.RequestDurationMiddleware)
		router.Use(middleware.ErrorCounterMiddleware)

		log.Println("Starting server on :8080")
		if err := http.ListenAndServe(":8080", router); err != nil {
			log.Fatalf("Could not start server: %s\n", err.Error())
		}
	}
}
