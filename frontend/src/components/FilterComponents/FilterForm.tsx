import React from "react";
import { Form, Button } from "antd";
import FilterFormItem from "./FilterFormItem";

interface OptionType {
  value: number | string;
  label: string;
}

interface FilterFormProps {
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

const FilterForm: React.FC<FilterFormProps> = ({
  form,
  onValuesChange,
  handleClear,
  typeOptions,
  statusOptions,
  conditionOptions,
  screenSizeOptions,
  modelYearOptions,
  ramOptions,
  processorTypeOptions,
  processorCoresOptions,
}) => {
  return (
    <Form
      form={form}
      labelCol={{ span: 20 }}
      wrapperCol={{ span: 20 }}
      layout="vertical"
      style={{ maxWidth: 600 }}
      onValuesChange={onValuesChange}
    >
      <FilterFormItem
        name="type_id"
        label="Component Type"
        options={typeOptions}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />
      <FilterFormItem name="status" label="Status" options={statusOptions} />
      <FilterFormItem
        name="condition"
        label="Condition"
        options={conditionOptions}
        showSearch
      />
      <FilterFormItem
        name="screen_size"
        label="Screen Size"
        options={screenSizeOptions}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />
      <FilterFormItem
        name="model_year"
        label="Model Year"
        options={modelYearOptions}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />
      <FilterFormItem
        name="ram"
        label="RAM"
        options={ramOptions}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />
      <FilterFormItem
        name="processor_type"
        label="Processor Type"
        options={processorTypeOptions}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />
      <FilterFormItem
        name="processor_cores"
        label="Processor Cores"
        options={processorCoresOptions}
        showSearch
        filterOption={(input, option) =>
          (option?.label ?? "").toLowerCase().includes(input.toLowerCase())
        }
      />
      <Form.Item>
        <Button className="ClearButton" type="default" onClick={handleClear}>
          Clear
        </Button>
      </Form.Item>
    </Form>
  );
};

export default FilterForm;
