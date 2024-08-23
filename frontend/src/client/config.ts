import axios from "axios";

export interface Config {
  tenantId: string;
  clientId: string;
}

export const fetchConfig = async (): Promise<Config> => {
  const response = await axios.get("http://localhost:8080/api/v1/config");
  return response.data;
};
