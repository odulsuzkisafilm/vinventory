import React from "react";
import { Input } from "antd";

interface InputFieldProps {
  label: string;
  name: string;
  value: string | number;
  type?: string;
  labelStyle?: React.CSSProperties;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  name,
  value,
  type = "text",
  onChange,
  labelStyle, // Destructure labelStyle prop
}) => (
  <p>
    <strong style={labelStyle}>{label}:</strong>
    {name === "notes" ? (
      <Input.TextArea name={name} value={value} onChange={onChange} />
    ) : (
      <Input name={name} value={value} onChange={onChange} type={type} />
    )}
  </p>
);

export default InputField;
