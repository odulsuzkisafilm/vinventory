import { MsalProvider } from "@azure/msal-react";
import { PublicClientApplication } from "@azure/msal-browser";
import WrappedView from "./WrappedView";
import { BrowserRouter } from "react-router-dom";

interface AppProps {
  instance: PublicClientApplication;
}

const App = ({ instance }: AppProps) => {
  return (
    <MsalProvider instance={instance}>
      <BrowserRouter>
        <WrappedView />
      </BrowserRouter>
    </MsalProvider>
  );
};

export default App;
