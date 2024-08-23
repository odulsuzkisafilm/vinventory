import React from "react";
import { Form, Input, Select, DatePicker } from "antd";

const { Option } = Select;

interface CustomFormItemProps {
  name: string;
  label: string;
  required: boolean;
  inputType?: string;
  selectOptions?: { value: string | number; label: string }[];
  datepicker?: boolean;
  textArea?: boolean;
}

const CustomFormItem: React.FC<CustomFormItemProps> = ({
  name,
  label,
  required,
  inputType = "text",
  selectOptions = [],
  datepicker = false,
  textArea = false,
}) => {
  return (
    <Form.Item
      name={name}
      label={label}
      rules={[{ required: required, message: `Please input the ${label}!` }]}
    >
      {datepicker ? (
        <DatePicker />
      ) : selectOptions.length > 0 ? (
        <Select>
          {selectOptions.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      ) : textArea ? (
        <Input.TextArea />
      ) : (
        <Input type={inputType} />
      )}
    </Form.Item>
  );
};

export default CustomFormItem;
