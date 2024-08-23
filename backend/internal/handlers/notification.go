package handlers

import (
	"gorm.io/gorm"
	"log"
	"time"
)

type Component struct {
	ID              uint
	SerialNumber    string
	WarrantyEndDate time.Time
	EmailNotified   bool
}

// GetComponentsWithExpiringWarranty queries components with warranties expiring soon
func GetComponentsWithExpiringWarranty(db *gorm.DB, days int) ([]Component, error) {
	var components []Component
	currentDate := time.Now()
	futureDate := currentDate.AddDate(0, 0, days)
	if err := db.Where("warranty_end_date > ? AND warranty_end_date <= ? AND email_notified = ?", currentDate, futureDate, false).Find(&components).Error; err != nil {
		return nil, err
	}
	log.Printf("Found %d components with expiring warranties", len(components))
	return components, nil
}
