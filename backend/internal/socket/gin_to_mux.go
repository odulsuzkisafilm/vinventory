package socket

import (
	"github.com/gin-gonic/gin"
	"github.com/gorilla/mux"
	"net/http"
)

func GinHandlerToMux(h gin.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		c, _ := gin.CreateTestContext(w)
		c.Request = r

		vars := mux.Vars(r)
		for key, value := range vars {
			c.Params = append(c.Params, gin.Param{Key: key, Value: value})
		}
		h(c)
	}
}
