import {
  ContactsOutlined,
  EditOutlined,
  ApartmentOutlined,
  ProfileOutlined,
  DownOutlined,
  LogoutOutlined,
  UserOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";
import { Avatar } from "antd";
import { Link } from "react-router-dom";

type MenuItem = Required<MenuProps>["items"][number];

export const items: MenuItem[] = [
  {
    label: "Items",
    key: "items",
    icon: <DownOutlined />,
    style: { marginRight: "30px" },
    popupOffset: [-20, -5],
    children: [
      {
        label: <Link to="/">Items</Link>,
        key: "",
        icon: <ProfileOutlined />,
      },
      {
        label: <Link to="/new-item">New Item</Link>,
        key: "new-item",
        icon: <EditOutlined />,
      },
    ],
  },
  {
    label: <Link to="/users">Users</Link>,
    key: "users",
    icon: <ContactsOutlined />,
    style: { marginRight: "30px" },
  },
  {
    label: "Types",
    key: "types",
    icon: <DownOutlined />,
    popupOffset: [-20, -5],
    children: [
      {
        label: <Link to="/types">Types</Link>,
        key: "types",
        icon: <ApartmentOutlined />,
      },
      {
        label: <Link to="/new-type">New Type</Link>,
        key: "new-type",
        icon: <EditOutlined />,
      },
    ],
  },
];

export const getLogoutItems = (
  currentUserData: any,
  photoUrl: string | null | undefined,
): MenuItem[] => [
  {
    label: (
      <a className="ant-dropdown-link" href="#/">
        {currentUserData?.displayName}{" "}
        {photoUrl ? (
          <Avatar size={32} src={photoUrl} alt="Profile Photo" />
        ) : (
          <Avatar size={32} icon={<UserOutlined />} />
        )}{" "}
      </a>
    ),
    key: "items",
    icon: <DownOutlined />,
    style: { marginRight: "1px" },
    popupOffset: [-5, -5],
    children: [
      {
        label: "Logout",
        key: "logout",
        icon: <LogoutOutlined />,
      },
    ],
  },
];
