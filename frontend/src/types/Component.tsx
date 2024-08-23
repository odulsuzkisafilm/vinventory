import { User } from "./User";
import { Condition, Status } from "../constants";

export interface Component {
  id: number;
  serialNumber: string;
  brand: string;
  model: string;
  condition: Condition;
  status: Status;
  user?: User | null;
  modelYear: number | null;
  typeId: number;
  screenSize: string;
  resolution: string;
  processorType: string;
  processorCores: number | null;
  ram: number | null;
  warrantyEndDate: string;
  notes: string;
}

export interface UserComponent {
  id: string;
  serialNumber: string;
}
