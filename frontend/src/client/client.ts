import axios from "axios";
import {
  PublicClientApplication,
  InteractionRequiredAuthError,
  BrowserAuthError,
} from "@azure/msal-browser";
import {
  initializeMsalConfig,
  msalConfig,
  loginRequest,
} from "../constants/auth-config";

let msalInstance: PublicClientApplication | null = null;

const initializeMsalInstance = async () => {
  await initializeMsalConfig(); // Fetch and initialize MSAL configuration
  msalInstance = new PublicClientApplication(msalConfig);
  await msalInstance.initialize(); // Ensure MSAL instance is fully initialized
};

const client = axios.create({
  baseURL: "http://localhost:8080/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

client.interceptors.request.use(
  async (config) => {
    const token = localStorage.getItem("id_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      console.error("No ID token found");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response &&
      error.response.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        if (!msalInstance) {
          await initializeMsalInstance();
        }

        if (msalInstance) {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            try {
              const response = await msalInstance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
              });

              localStorage.setItem("id_token", response.idToken);

              originalRequest.headers.Authorization = `Bearer ${response.idToken}`;
              return client(originalRequest);
            } catch (silentError) {
              if (silentError instanceof InteractionRequiredAuthError) {
                console.error(
                  "Silent token acquisition failed, requiring interaction",
                  silentError,
                );
                await msalInstance.acquireTokenRedirect(loginRequest);
              } else {
                console.error("Silent token acquisition failed", silentError);
              }
            }
          } else {
            console.error("No accounts found");
          }
        }
      } catch (error) {
        if (error instanceof InteractionRequiredAuthError) {
          console.error("Interaction required to get a new token", error);
          if (msalInstance) {
            await msalInstance.acquireTokenRedirect(loginRequest);
          }
        } else if (error instanceof BrowserAuthError) {
          console.error("MSAL BrowserAuthError:", error);
        } else {
          console.error("Failed to acquire token silently", error);
        }
      }
    }

    console.error(
      "API response error:",
      error.response ? error.response.data : error.message,
    );
    return Promise.reject(error);
  },
);

export default client;
