import moment from "moment/moment";

export interface NewItemForm {
  serialNumber: string;
  brand: string;
  model: string;
  modelYear?: number;
  condition: string;
  status: string;
  typeId: number;
  screenSize: string;
  resolution: string;
  processorType: string;
  processorCores?: number;
  ram?: number;
  warrantyEndDate: moment.Moment;
  notes: string;
}
