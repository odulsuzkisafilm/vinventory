export const FormItemsConfig = [
  {
    name: "serialNumber",
    label: "Serial Number",
  },
  {
    name: "brand",
    label: "Brand",
  },
  {
    name: "model",
    label: "Model",
  },
  {
    name: "modelYear",
    label: "Model Year",
    inputType: "number",
  },
  {
    name: "condition",
    label: "Condition",
    selectOptions: [
      { value: "Functioning", label: "Functioning" },
      { value: "Slightly Damaged", label: "Slightly Damaged" },
      { value: "Broken", label: "Broken" },
    ],
  },
  {
    name: "screenSize",
    label: "Screen Size",
  },
  {
    name: "resolution",
    label: "Resolution",
  },
  {
    name: "processorType",
    label: "Processor Type",
  },
  {
    name: "processorCores",
    label: "Processor Cores",
  },
  {
    name: "ram",
    label: "RAM",
  },
  {
    name: "warrantyEndDate",
    label: "Warranty End Date",
    datepicker: true,
  },
  {
    name: "notes",
    label: "Notes",
    textArea: true,
  },
];
