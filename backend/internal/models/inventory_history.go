package models

import "time"

type InventoryHistory struct {
	ID            int       `json:"id" gorm:"primaryKey"`
	CreatedAt     time.Time `json:"createdAt"`
	ComponentID   int       `json:"componentId"`
	UserID        string    `json:"userId"`
	OperationType string    `json:"operationType" gorm:"type:inventory_operation_type"`
	UserName      string    `json:"userName"`
}

func (InventoryHistory) TableName() string {
	return "inventory_history"
}
