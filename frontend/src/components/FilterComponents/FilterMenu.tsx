import React from "react";
import { Layout } from "antd";
import { FilterMenuProps } from "../../types/FilterInterfaces";
import FilterOptions from "./FilterOptions";

const { Sider } = Layout;

const FilterMenu: React.FC<FilterMenuProps> = ({
  collapsed,
  onFilterMenuChange,
}) => {
  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      width="20%"
      style={{ paddingLeft: "2%", paddingTop: "2%" }}
    >
      {!collapsed && <FilterOptions onFiltersChange={onFilterMenuChange} />}
    </Sider>
  );
};

export default FilterMenu;
