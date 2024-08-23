package handlers

import (
	"log"
	"net/http"

	gormpkg "gorm.io/gorm"
)

func LivenessCheckHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func ReadinessCheckHandler(db *gormpkg.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if err := db.Exec("SELECT 1").Error; err != nil {

			log.Printf("Readiness check failed: %v", err)
			http.Error(w, "Service not ready", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Ready"))
	}
}
