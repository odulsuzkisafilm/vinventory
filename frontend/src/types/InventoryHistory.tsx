import { User } from "./User";

export interface InventoryHistory {
  id: number;
  createdAt: string;
  componentId: number;
  userId: string;
  operationType: string;
  userName: string;
  user?: User;
}

export interface UserInventoryHistory {
  id: string;
  createdAt: string;
  operationType: string;
  componentId: number;
  componentSerialNumber?: string;
}
