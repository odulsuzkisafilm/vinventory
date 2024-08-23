import React from "react";
import { Select, Form } from "antd";
import { FilterFormItemProps } from "../../types/FilterInterfaces";
import "../../styles/FilterOptions.css";

const FilterFormItem: React.FC<FilterFormItemProps> = ({
  name,
  label,
  options,
  allowClear = true,
  showSearch = false,
  filterOption,
}) => (
  <Form.Item className="filterFormItem" name={name} label={label}>
    <Select
      showSearch={showSearch}
      allowClear={allowClear}
      options={options}
      filterOption={filterOption}
    />
  </Form.Item>
);

export default FilterFormItem;
