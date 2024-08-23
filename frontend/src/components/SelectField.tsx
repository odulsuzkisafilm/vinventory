import React from "react";
import { Select } from "antd";
import { Condition } from "../constants";

const { Option } = Select;

interface SelectFieldProps {
  label: string;
  value: Condition;
  onChange: (value: Condition) => void;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  value,
  onChange,
}) => (
  <p>
    <strong>{label}:</strong>
    <Select value={value} onChange={onChange}>
      <Option value={Condition.Functioning}>{Condition.Functioning}</Option>
      <Option value={Condition.SlightlyDamaged}>
        {Condition.SlightlyDamaged}
      </Option>
      <Option value={Condition.Broken}>{Condition.Broken}</Option>
    </Select>
  </p>
);

export default SelectField;
