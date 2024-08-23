package email

import (
	"fmt"
	"gorm.io/gorm"
	"log"
	"net/smtp"
	"strings"
	"vinventory/internal/config"
	"vinventory/internal/handlers"
)

// EmailConfig holds the email server configuration
type EmailConfig struct {
	SMTPHost      string
	SMTPPort      string
	Username      string
	Password      string
	SenderEmail   string
	ReceiverEmail string
}

// SendEmail sends an email notification
func SendEmail(config EmailConfig, subject, body string) error {
	auth := smtp.PlainAuth("", config.Username, config.Password, config.SMTPHost)

	to := []string{config.ReceiverEmail}
	msg := []byte("To: " + config.ReceiverEmail + "\r\n" +
		"Subject: " + subject + "\r\n" +
		"\r\n" +
		body + "\r\n")

	addr := fmt.Sprintf("%s:%s", config.SMTPHost, config.SMTPPort)
	err := smtp.SendMail(addr, auth, config.SenderEmail, to, msg)
	if err != nil {
		log.Printf("Failed to send email: %v", err)
		return fmt.Errorf("failed to send email: %v", err)
	}

	return nil
}

// NotifyExpiringWarranties checks for expiring warranties and sends email notifications
func NotifyExpiringWarranties(db *gorm.DB, cfg config.Config) {
	components, err := handlers.GetComponentsWithExpiringWarranty(db, 30) // Check for warranties expiring in 30 days
	if err != nil {
		log.Printf("Error fetching components with expiring warranties: %v", err)
		return
	}

	if len(components) == 0 {
		log.Println("No components with expiring warranties found")
		return
	}

	var bodyBuilder strings.Builder
	bodyBuilder.WriteString("The following components have warranties expiring soon:\n\n")

	for _, component := range components {
		bodyBuilder.WriteString(fmt.Sprintf("Component %s (ID: %d) is expiring on %s.\n", component.SerialNumber, component.ID, component.WarrantyEndDate.Format("2006-01-02")))
		component.EmailNotified = true
		if err := db.Save(&component).Error; err != nil {
			log.Printf("Error updating email_notified for component %d: %v", component.ID, err)
		}
	}

	emailConfig := EmailConfig{
		SMTPHost:      cfg.SMTPHost,
		SMTPPort:      cfg.SMTPPort,
		Username:      cfg.SMTPUsername,
		Password:      cfg.SMTPPassword,
		SenderEmail:   cfg.SenderEmail,
		ReceiverEmail: cfg.ReceiverEmail,
	}

	subject := "Warranty Expiration Notices"
	body := bodyBuilder.String()
	if err := SendEmail(emailConfig, subject, body); err != nil {
		log.Println(err)
	} else {
		log.Println("Email sent successfully")
	}
}
