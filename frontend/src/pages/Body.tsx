import React, { useState, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import Items from "./Items";
import Users from "./Users";
import NewItem from "./NewItem";
import NewType from "./NewType";
import Types from "./Types";
import ValensasLogo from "../components/ValensasLogo";
import "../styles/App.css";
import FilterMenu from "../components/FilterComponents/FilterMenu";
import { FilterValues } from "../types/FilterInterfaces";
import { Button, Layout, Menu, theme } from "antd";
import type { MenuProps } from "antd";
import { MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { items, getLogoutItems } from "../constants/MenuItems";
import { BodyType } from "../types";

const { Header, Content } = Layout;

const Body: React.FC<BodyType> = ({
  currentUserData,
  photoUrl,
  handleLogout,
}) => {
  const [current, setCurrent] = useState(useLocation().pathname.substring(1));
  const [collapsed, setCollapsed] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({});
  const [isAtTop, setIsAtTop] = useState(true);

  const handleFilterChange = (newFilters: FilterValues) => {
    setFilters(newFilters);
  };
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--colorBgContainer",
      colorBgContainer,
    );
    document.documentElement.style.setProperty(
      "--borderRadiusLG",
      `${borderRadiusLG}px`,
    );
  }, [colorBgContainer, borderRadiusLG]);

  const onClick: MenuProps["onClick"] = (e) => {
    console.log("click ", e);
    setCurrent(e.key);
  };

  const LogoClick = () => {
    console.log("click ", "");
    setCurrent("");
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsAtTop(window.scrollY < 1);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header className={`header ${isAtTop ? "at-top" : "scrolled"}`}>
        <ValensasLogo onClick={LogoClick} />
        <Menu
          onClick={onClick}
          selectedKeys={[current]}
          mode="horizontal"
          items={items}
          theme="dark"
        />
        <Menu
          onClick={handleLogout}
          mode="horizontal"
          items={getLogoutItems(currentUserData, photoUrl)}
          theme="dark"
        />
      </Header>
      <Layout style={{ marginTop: "64px" }}>
        {" "}
        {useLocation().pathname === "/" && (
          <FilterMenu
            collapsed={collapsed}
            onFilterMenuChange={handleFilterChange}
          />
        )}
        <Layout className="site-layout">
          {useLocation().pathname === "/" && (
            <Header
              className="site-layout-background"
              style={{ padding: 0, background: colorBgContainer, zIndex: 1 }}
            >
              <Button
                className="button"
                type="text"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed(!collapsed)}
              />
            </Header>
          )}
          <Content className="siteBackground">
            <Routes>
              <Route
                path="/"
                element={
                  <Items filters={filters} currentUserData={currentUserData} />
                }
              />
              <Route path="/users" element={<Users />} />
              <Route
                path="/new-item"
                element={<NewItem currentUserData={currentUserData} />}
              />
              <Route path="/new-type" element={<NewType />} />
              <Route path="/types" element={<Types />} />
            </Routes>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
};

export default Body;
