package models

import "time"

type Component struct {
	ID              int       `json:"id"`
	Status          string    `json:"status" gorm:"default:'Ready to Use'"`
	Brand           string    `json:"brand"`
	Model           string    `json:"model"`
	ModelYear       *int      `json:"modelYear"`
	TypeID          int       `json:"typeId"`
	ScreenSize      string    `json:"screenSize"`
	Resolution      string    `json:"resolution"`
	ProcessorType   string    `json:"processorType"`
	ProcessorCores  *int      `json:"processorCores"`
	RAM             *int      `json:"ram"`
	WarrantyEndDate time.Time `json:"warrantyEndDate"`
	SerialNumber    string    `json:"serialNumber"`
	Condition       string    `json:"condition"`
	Notes           string    `json:"notes"`
	EmailNotified   bool      `json:"emailNotified"`
}
