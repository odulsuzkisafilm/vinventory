package models

import (
	"github.com/lib/pq"
)

type ComponentType struct {
	ID             int            `json:"id" gorm:"primaryKey"`
	Name           string         `json:"name"`
	Attributes     pq.StringArray `json:"-" gorm:"type:text[]"`
	AttributesList []string       `json:"attributes" gorm:"-"`
}
