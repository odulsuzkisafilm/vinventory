import React, { useEffect, useState } from "react";
import { Form } from "antd";
import client from "../../client/client";
import { FilterOptionsProps, OptionType } from "../../types/FilterInterfaces";
import FilterForm from "./FilterForm";
import "../../styles/FilterOptions.css";

const FilterOptions: React.FC<FilterOptionsProps> = ({ onFiltersChange }) => {
  const [form] = Form.useForm();
  const [ramOptions, setRamOptions] = useState<OptionType[]>([]);
  const [statusOptions, setStatusOptions] = useState<OptionType[]>([]);
  const [conditionOptions, setConditionOptions] = useState<OptionType[]>([]);
  const [processorTypeOptions, setProcessorTypeOptions] = useState<
    OptionType[]
  >([]);
  const [processorCoresOptions, setProcessorCoresOptions] = useState<
    OptionType[]
  >([]);
  const [screenSizeOptions, setScreenSizeOptions] = useState<OptionType[]>([]);
  const [modelYearOptions, setModelYearOptions] = useState<OptionType[]>([]);
  const [typeOptions, setTypeOptions] = useState<OptionType[]>([]);

  useEffect(() => {
    const fetchOptions = async (
      endpoint: string,
      setOptions: React.Dispatch<React.SetStateAction<OptionType[]>>,
    ) => {
      try {
        const url = `components/${endpoint}/uniquevalue`;
        const response = await client.get<(number | string)[]>(url);

        const options: OptionType[] = response.data
          .filter((value): value is number | string => value !== "")
          .map((value: number | string) => ({
            value: value,
            label: value.toString(),
          }));
        setOptions(options);
      } catch (error) {
        console.error(`Error fetching ${endpoint} options:`, error);
      }
    };

    const fetchTypes = async () => {
      try {
        const url = `/types`;
        const response = await client.get(url);

        const options: OptionType[] = response.data.map(
          (type: { id: number; name: string }) => ({
            value: type.id,
            label: type.name,
          }),
        );

        setTypeOptions(options);
      } catch (error) {
        console.error("Error fetching types:", error);
      }
    };

    fetchOptions("ram", setRamOptions);
    fetchOptions("status", setStatusOptions);
    fetchOptions("condition", setConditionOptions);
    fetchOptions("processor_type", setProcessorTypeOptions);
    fetchOptions("processor_cores", setProcessorCoresOptions);
    fetchOptions("screen_size", setScreenSizeOptions);
    fetchOptions("model_year", setModelYearOptions);
    fetchTypes();
  }, []);

  const handleValuesChange = () => {
    const values = form.getFieldsValue();
    onFiltersChange(values);
  };

  const handleClear = () => {
    form.resetFields();
    onFiltersChange({});
  };

  return (
    <FilterForm
      form={form}
      onValuesChange={handleValuesChange}
      handleClear={handleClear}
      typeOptions={typeOptions}
      statusOptions={statusOptions}
      conditionOptions={conditionOptions}
      screenSizeOptions={screenSizeOptions}
      modelYearOptions={modelYearOptions}
      ramOptions={ramOptions}
      processorTypeOptions={processorTypeOptions}
      processorCoresOptions={processorCoresOptions}
    />
  );
};

export default FilterOptions;
