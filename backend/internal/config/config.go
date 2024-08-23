package config

import (
	"fmt"
	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
	"log"
	"net/url"
	"os"
	"time"
)

// Config holds the database configuration.
type Config struct {
	DBUser        string
	DBPassword    string
	DBName        string
	DBHost        string
	DBPort        string
	SMTPHost      string
	SMTPPort      string
	SMTPUsername  string
	SMTPPassword  string
	SenderEmail   string
	ReceiverEmail string
}

type MinioConfig struct {
	MinioAccessKey string
	MinioSecretKey string
	MinioEndpoint  string
	MinioUseSSL    bool
}

func init() {
	err := godotenv.Load()
	if err != nil {
		log.Println("No .env file found or error in loading, relying on environment variables")
	}
}

func ConfigMinio() MinioConfig {
	useSSL := os.Getenv("MINIO_USE_SSL")
	if useSSL == "" {
		useSSL = "true"
	}

	return MinioConfig{
		MinioAccessKey: os.Getenv("MINIO_ACCESS_KEY"),
		MinioSecretKey: os.Getenv("MINIO_SECRET_KEY"),
		MinioEndpoint:  os.Getenv("MINIO_ENDPOINT"),
		MinioUseSSL:    useSSL == "true",
	}
}

// LoadConfig loads the database and SMTP configuration from environment variables.
func LoadConfig() Config {
	return Config{
		DBUser:        os.Getenv("DB_USER"),
		DBPassword:    os.Getenv("DB_PASSWORD"),
		DBName:        os.Getenv("DB_NAME"),
		DBHost:        os.Getenv("DB_HOST"),
		DBPort:        os.Getenv("DB_PORT"),
		SMTPHost:      os.Getenv("SMTP_HOST"),
		SMTPPort:      os.Getenv("SMTP_PORT"),
		SMTPUsername:  os.Getenv("SMTP_USERNAME"),
		SMTPPassword:  os.Getenv("SMTP_PASSWORD"),
		SenderEmail:   os.Getenv("SENDER_EMAIL"),
		ReceiverEmail: os.Getenv("RECEIVER_EMAIL"),
	}
}

func InitDatabase(cfg Config) (*gorm.DB, error) {
	dbUser := url.QueryEscape(cfg.DBUser)
	dbPassword := url.QueryEscape(cfg.DBPassword)
	dbHost := url.QueryEscape(cfg.DBHost)
	dbName := url.QueryEscape(cfg.DBName)

	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
		dbHost, dbUser, dbPassword, dbName, cfg.DBPort)

	configuration := &gorm.Config{
		SkipDefaultTransaction:                   false,
		NamingStrategy:                           nil,
		FullSaveAssociations:                     false,
		Logger:                                   logger.Default.LogMode(logger.Silent),
		NowFunc:                                  func() time.Time { return time.Now().UTC() },
		DryRun:                                   false,
		PrepareStmt:                              false,
		DisableAutomaticPing:                     false,
		DisableForeignKeyConstraintWhenMigrating: false,
		IgnoreRelationshipsWhenMigrating:         false,
		DisableNestedTransaction:                 false,
		AllowGlobalUpdate:                        false,
		QueryFields:                              false,
		CreateBatchSize:                          0,
		TranslateError:                           false,
		ClauseBuilders:                           nil,
		ConnPool:                                 nil,
		Dialector:                                nil,
		Plugins:                                  nil,
	}

	db, err := gorm.Open(postgres.Open(dsn), configuration)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	log.Println("Database connection successfully established")
	return db, nil
}
