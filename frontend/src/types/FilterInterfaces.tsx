export interface FilterValues {
  type_id?: string;
  serial_number?: string;
  status?: string;
  condition?: string;
  model_year?: number;
  ram?: number;
  processor_type?: string;
  processor_cores?: string;
  screen_size?: string;
}

export interface FilterFormItemProps {
  name: string;
  label: string;
  options: { value: string | number; label: string }[];
  allowClear?: boolean;
  showSearch?: boolean;
  filterOption?: (input: string, option?: { label: string }) => boolean;
}

export interface FilterOptionsProps {
  onFiltersChange: (values: FilterValues) => void;
}

export interface OptionType {
  value: number | string;
  label: string;
}

export interface FilterFormProps {
  form: any;
  onValuesChange: () => void;
  handleClear: () => void;
  typeOptions: OptionType[];
  statusOptions: OptionType[];
  conditionOptions: OptionType[];
  screenSizeOptions: OptionType[];
  modelYearOptions: OptionType[];
  ramOptions: OptionType[];
  processorTypeOptions: OptionType[];
  processorCoresOptions: OptionType[];
}

export interface FilterMenuProps {
  collapsed: boolean;
  onFilterMenuChange: (filters: FilterValues) => void;
}
