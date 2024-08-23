package middleware

import (
	"context"
	"fmt"
	"github.com/MicahParks/keyfunc"
	"log"
	"net/http"
	"net/url"
	"os"
	"runtime"
	"strings"
	"time"

	"vinventory/internal/metrics"

	JWT "github.com/golang-jwt/jwt/v4"
)

// AuthMiddleware validates JWT tokens from Azure AD
func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		tokenString := extractToken(r)
		if tokenString == "" {
			http.Error(w, "Unauthorized: no token provided", http.StatusUnauthorized)
			return
		}

		token, err := verifyIDToken(r.Context(), tokenString)
		if err != nil {
			http.Error(w, "Unauthorized: "+err.Error(), http.StatusUnauthorized)
			return
		}

		ctx := context.WithValue(r.Context(), "user", token)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// extractToken extracts the token from the Authorization header or cookie
func extractToken(r *http.Request) string {
	// Try to extract from Authorization header first
	bearerToken := r.Header.Get("Authorization")
	if bearerToken != "" {
		tokenParts := strings.Split(bearerToken, " ")
		if len(tokenParts) == 2 {
			return tokenParts[1]
		}
	}

	// Fallback to extracting token from cookie
	accessCookie, err := r.Cookie("id_token")
	if err == nil {
		fmt.Println("Token extracted from cookie:", accessCookie.Value)
		return accessCookie.Value
	}

	return ""
}

// verifyIDToken verifies the ID token using public keys fetched from Azure AD
func verifyIDToken(ctx context.Context, tokenString string) (*JWT.Token, error) {
	tenantID := url.QueryEscape(os.Getenv("AZURE_TENANT_ID"))
	jwksURL := fmt.Sprintf("https://login.microsoftonline.com/%s/discovery/v2.0/keys", tenantID)

	options := keyfunc.Options{
		Ctx: ctx,
		RefreshErrorHandler: func(err error) {
			log.Printf("There was an error with the jwt.Keyfunc\nError: %s", err.Error())
		},
		RefreshInterval:   time.Hour,
		RefreshRateLimit:  time.Minute * 5,
		RefreshTimeout:    time.Second * 10,
		RefreshUnknownKID: true,
	}

	// Create the JWKS from the resource at the given URL.
	jwks, err := keyfunc.Get(jwksURL, options)
	if err != nil {
		return nil, fmt.Errorf("failed to create JWKS from resource at the given URL: %w", err)
	}
	defer jwks.EndBackground()

	// Parse the JWT.
	token, err := JWT.Parse(tokenString, jwks.Keyfunc)
	if err != nil {
		return nil, fmt.Errorf("could not parse or verify JWT token: %w", err)
	}

	// Check if the token is valid.
	if !token.Valid {
		return nil, fmt.Errorf("the token is not valid")
	}

	log.Println("The token is valid.")
	return token, nil
}

// Counts HTTP requests
func RequestCounterMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		metrics.HttpRequestsTotal.WithLabelValues(r.Method, r.URL.Path).Inc()
		next.ServeHTTP(w, r)
	})
}

// Tracks HTTP request duration
func RequestDurationMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		duration := time.Since(start).Seconds()
		metrics.HttpRequestDuration.WithLabelValues(r.Method, r.URL.Path).Observe(duration)
	})
}

// Middleware for counting errors
func ErrorCounterMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if rec := recover(); rec != nil {
				// Track the panic error (this could be expanded to handle more error types)
				metrics.ErrorsTotal.WithLabelValues("panic", r.URL.Path).Inc()
				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()

		// Pass the request to the next middleware/handler
		next.ServeHTTP(w, r)
	})
}

// Track memory usage
func TrackMemoryUsage() {
	var m runtime.MemStats
	runtime.ReadMemStats(&m)
	metrics.MemoryUsage.Set(float64(m.Alloc))
}

// Increment the processed operations counter
func IncrementOpsProcessed() {
	metrics.OpsProcessed.Inc()
}
