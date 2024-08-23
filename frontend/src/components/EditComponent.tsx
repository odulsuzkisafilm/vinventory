import React, { useEffect, useState } from "react";
import InputField from "./InputField";
import SelectField from "./SelectField";
import { Component, ComponentType, User } from "../types";
import { Condition } from "../constants";
import { DatePicker } from "antd";
import dayjs from "dayjs";

interface EditComponentProps {
  component: Component;
  componentType: ComponentType | null;
  lastInteractant: User | null;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => void;
  onConditionChange: (value: Condition) => void;
  onDateChange: (
    date: dayjs.Dayjs | null,
    dateString: string | string[],
  ) => void;
  onErrorChange: (hasErrors: boolean) => void;
}

export const EditComponent: React.FC<EditComponentProps> = ({
  component,
  componentType,
  lastInteractant,
  onChange,
  onConditionChange,
  onDateChange,
  onErrorChange,
}) => {
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (componentType) {
      const newErrors: { [key: string]: string } = {};
      componentType.attributes.forEach((attr) => {
        const value = component[attr as keyof Component];
        if (value === undefined || value === null || value === "") {
          newErrors[attr] = `${attr} is required`;
        }
      });

      const checkPositiveInteger = (value: any, attr: string) => {
        if (value !== "" && value !== undefined && value !== null) {
          const numValue = Number(value);
          if (
            isNaN(value) ||
            isNaN(numValue) ||
            !Number.isInteger(numValue) ||
            numValue <= 0
          ) {
            newErrors[attr] = `${attr} must be a positive integer`;
          }
        }
      };

      if (component.ram !== undefined) {
        checkPositiveInteger(component.ram, "ram");
      }
      if (component.processorCores !== undefined) {
        checkPositiveInteger(component.processorCores, "processorCores");
      }
      if (component.modelYear !== undefined) {
        checkPositiveInteger(component.modelYear, "modelYear");
      }

      setErrors(newErrors);
      onErrorChange(Object.keys(newErrors).length > 0);
    }
  }, [component, componentType, onErrorChange]);

  return (
    <>
      <InputField
        label="Serial Number"
        name="serialNumber"
        value={component.serialNumber}
        onChange={onChange}
      />
      {errors.serialNumber && (
        <p style={{ color: "red" }}>{errors.serialNumber}</p>
      )}

      <InputField
        label="Brand"
        name="brand"
        value={component.brand}
        onChange={onChange}
      />
      {errors.brand && <p style={{ color: "red" }}>{errors.brand}</p>}

      <InputField
        label="Model"
        name="model"
        value={component.model}
        onChange={onChange}
      />
      {errors.model && <p style={{ color: "red" }}>{errors.model}</p>}

      <InputField
        label="Model Year"
        name="modelYear"
        value={component.modelYear !== null ? component.modelYear : ""}
        onChange={onChange}
        type="number"
      />
      {errors.modelYear && <p style={{ color: "red" }}>{errors.modelYear}</p>}

      <p>
        <strong>Item Type:</strong> {componentType?.name}
      </p>

      <InputField
        label="Screen Size"
        name="screenSize"
        value={component.screenSize}
        onChange={onChange}
      />
      {errors.screenSize && <p style={{ color: "red" }}>{errors.screenSize}</p>}

      <InputField
        label="Resolution"
        name="resolution"
        value={component.resolution}
        onChange={onChange}
      />
      {errors.resolution && <p style={{ color: "red" }}>{errors.resolution}</p>}

      <InputField
        label="Processor Type"
        name="processorType"
        value={component.processorType}
        onChange={onChange}
      />
      {errors.processorType && (
        <p style={{ color: "red" }}>{errors.processorType}</p>
      )}

      <InputField
        label="Processor Cores"
        name="processorCores"
        value={
          component.processorCores !== null ? component.processorCores : ""
        }
        onChange={onChange}
        type="number"
      />
      {errors.processorCores && (
        <p style={{ color: "red" }}>{errors.processorCores}</p>
      )}

      <InputField
        label="RAM"
        name="ram"
        value={component.ram !== null ? component.ram : ""}
        onChange={onChange}
        type="number"
      />
      {errors.ram && <p style={{ color: "red" }}>{errors.ram}</p>}

      <strong>Warranty End Date: </strong>
      <DatePicker
        value={
          component.warrantyEndDate ? dayjs(component.warrantyEndDate) : null
        }
        onChange={onDateChange}
      />
      {errors.warrantyEndDate && (
        <p style={{ color: "red" }}>{errors.warrantyEndDate}</p>
      )}

      <SelectField
        label="Condition"
        value={component.condition}
        onChange={onConditionChange}
      />
      {errors.condition && <p style={{ color: "red" }}>{errors.condition}</p>}

      <p>
        <strong>Status:</strong> {component.status}
      </p>
      <p>
        <strong>Last Interactant:</strong>{" "}
        {lastInteractant
          ? `${lastInteractant.firstName} ${lastInteractant.lastName}`
          : "N/A"}
      </p>
      <p>
        <strong>Last Interactant's Email:</strong>{" "}
        {lastInteractant ? lastInteractant.email : "N/A"}
      </p>
      <InputField
        label="Notes"
        name="notes"
        value={component.notes}
        onChange={onChange}
      />
      {errors.notes && <p style={{ color: "red" }}>{errors.notes}</p>}
    </>
  );
};
