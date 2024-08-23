import { LogLevel, Configuration } from "@azure/msal-browser";
import { fetchConfig, Config } from "../client/config";

export let msalConfig: Configuration;

export const initializeMsalConfig = async (): Promise<void> => {
  const config: Config = await fetchConfig();

  msalConfig = {
    auth: {
      clientId: config.clientId,
      authority: `https://login.microsoftonline.com/${config.tenantId}`,
      redirectUri: "http://localhost:3000/",
      postLogoutRedirectUri: "/",
      navigateToLoginRequestUrl: false,
    },
    cache: {
      cacheLocation: "sessionStorage",
      storeAuthStateInCookie: false,
    },
    system: {
      loggerOptions: {
        loggerCallback: (
          level: LogLevel,
          message: string,
          containsPii: boolean,
        ) => {
          if (containsPii) {
            return;
          }
          switch (level) {
            case LogLevel.Error:
              console.error(message);
              return;
            case LogLevel.Info:
              console.info(message);
              return;
            case LogLevel.Verbose:
              console.debug(message);
              return;
            case LogLevel.Warning:
              console.warn(message);
              return;
            default:
              return;
          }
        },
      },
    },
  };
};

export const loginRequest = {
  scopes: ["openid", "profile", "email", "user.read", "User.ReadBasic.All"],
};
