import React, { useState, useEffect } from "react";
import {
  AuthenticatedTemplate,
  UnauthenticatedTemplate,
  useMsal,
} from "@azure/msal-react";
import client from "axios";
import Body from "./Body";
import { loginRequest } from "../constants/auth-config";
import { AccountInfo } from "../types/AccountInfo";
import "../styles/LandingPage.css";

const generateRandomString = (length: number): string => {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charset.length);
    result += charset[randomIndex];
  }
  return result;
};

const WrappedView: React.FC = () => {
  const { instance, accounts } = useMsal();
  const [currentUserData, setCurrentUserData] = useState<AccountInfo | null>(
    null,
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  const handleRedirect = () => {
    const state = generateRandomString(16);
    instance
      .loginRedirect({
        ...loginRequest,
        state: state,
        prompt: "select_account",
      })
      .catch((error) => console.error(error));
  };

  const handleLogout = () => instance.logout();

  useEffect(() => {
    const fetchData = async () => {
      if (accounts.length > 0) {
        const account = accounts[0];

        try {
          const response = await instance.acquireTokenSilent({
            ...loginRequest,
            account: account,
          });

          const userRes = await client.get<AccountInfo>(
            "https://graph.microsoft.com/v1.0/me",
            {
              headers: {
                Authorization: `Bearer ${response.accessToken}`,
              },
            },
          );

          setCurrentUserData(userRes.data);

          const photoRes = await fetch(
            `https://graph.microsoft.com/v1.0/me/photo/$value`,
            {
              headers: {
                Authorization: `Bearer ${response.accessToken}`,
              },
            },
          );

          if (photoRes.ok) {
            const photoBlob = await photoRes.blob();
            const photoUri = URL.createObjectURL(photoBlob);
            setPhotoUrl(photoUri);
          }
        } catch (error) {
          console.error(error);
          await instance.acquireTokenRedirect(loginRequest);
        }
      }
    };

    fetchData();
  }, [instance, accounts, photoUrl]);

  return (
    <>
      <AuthenticatedTemplate>
        <Body
          currentUserData={currentUserData}
          photoUrl={photoUrl}
          handleLogout={handleLogout}
        />
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <div className="landing-page">
          <div className="landing-page-content">
            <h1>Welcome to Vinventory</h1>
            <button onClick={handleRedirect}>Login with Microsoft</button>
          </div>
        </div>
      </UnauthenticatedTemplate>
    </>
  );
};

export default WrappedView;
