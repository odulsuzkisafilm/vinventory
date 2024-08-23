import React from "react";
import ReactDOM from "react-dom/client";
import "./styles/index.css";
import App from "./pages/App";
import {
  PublicClientApplication,
  EventType,
  AccountInfo,
  EventMessage,
} from "@azure/msal-browser";
import { initializeMsalConfig, msalConfig } from "./constants/auth-config";

const initializeApp = async () => {
  await initializeMsalConfig(); // Fetch and initialize MSAL configuration

  const msalInstance = new PublicClientApplication(msalConfig);

  msalInstance.initialize().then(() => {
    if (
      !msalInstance.getActiveAccount() &&
      msalInstance.getAllAccounts().length > 0
    ) {
      msalInstance.setActiveAccount(msalInstance.getAllAccounts()[0]);
    }

    msalInstance.addEventCallback((event: EventMessage) => {
      if (
        event.eventType === EventType.LOGIN_SUCCESS &&
        event.payload &&
        (event.payload as any).account
      ) {
        const account = (event.payload as { account: AccountInfo }).account;
        msalInstance.setActiveAccount(account);

        const idToken = (event.payload as any).idToken;
        if (idToken) {
          localStorage.setItem("id_token", idToken);
        }
      }
    });

    const root = ReactDOM.createRoot(document.getElementById("root")!);
    root.render(
      // <React.StrictMode>
      <App instance={msalInstance} />,
      // </React.StrictMode>
    );
  });
};

initializeApp();
