import React from "react";
import { Menu } from "antd";
import { Link } from "react-router-dom";

interface MenuItem {
  label: string;
  link: string;
}

interface CustomMenuProps {
  menuItems: MenuItem[];
  basePath: string;
}

const CustomMenu: React.FC<CustomMenuProps> = ({ menuItems, basePath }) => (
  <Menu>
    {menuItems.map((item, index) => (
      <Menu.Item key={index + 1}>
        <Link to={`${basePath}${item.link}`}>{item.label}</Link>
      </Menu.Item>
    ))}
  </Menu>
);

export default CustomMenu;
