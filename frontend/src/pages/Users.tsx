import React, { useEffect, useState } from "react";
import { Table, Button, Modal, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import client from "../client/client";
import "../styles/ComponentBorder.css";
import { User, UserComponent, UserInventoryHistory } from "../types";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inventoryHistory, setInventoryHistory] = useState<
    UserInventoryHistory[]
  >([]);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const storedPage = localStorage.getItem("currentPage");
    if (storedPage) {
      setCurrentPage(Number(storedPage));
    }

    const fetchUsers = async () => {
      try {
        const response = await client.post("auth/users");
        setUsers(response.data);
        fetchPhotos(response.data);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    return () => {
      localStorage.removeItem("currentPage");
    };
  }, []);

  const fetchPhotos = async (users: User[]) => {
    const updatedUsers = await Promise.all(
      users.map(async (user) => {
        try {
          const response = await client.get(`auth/users/${user.id}/photo`);
          user.photoUrl = response.data.photoUrl;
        } catch (error) {
          console.error("Error fetching user photo:", error);
        }
        return user;
      }),
    );
    setUsers(updatedUsers);
  };

  const showInventoryHistory = async (userId: string) => {
    try {
      const response = await client.get(`users/${userId}/inventory-history`);
      const historyWithSerials = await Promise.all(
        response.data.map(async (history: UserInventoryHistory) => {
          const componentResponse = await client.get<UserComponent>(
            `components/${history.componentId}`,
          );
          return {
            ...history,
            componentSerialNumber: componentResponse.data.serialNumber,
          };
        }),
      );

      // Sort history by createdAt date from new to old
      historyWithSerials.sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
      );

      setInventoryHistory(historyWithSerials);
      setHistoryVisible(true);
    } catch (error) {
      console.error("Error fetching inventory history:", error);
    }
  };

  const handleHistoryModalClose = () => {
    setHistoryVisible(false);
    setInventoryHistory([]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem("currentPage", page.toString());
  };

  const columns = [
    {
      title: "Profile",
      key: "profile",
      render: (text: any, record: User) => (
        <Avatar
          src={record.photoUrl || undefined}
          icon={!record.photoUrl ? <UserOutlined /> : undefined}
          size={50}
        />
      ),
    },
    {
      title: "AAD ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Display Name",
      dataIndex: "displayName",
      key: "displayName",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
    },
    {
      title: "History",
      key: "actions",
      render: (text: any, record: User) => (
        <Button onClick={() => showInventoryHistory(record.id)}>
          View Actions
        </Button>
      ),
    },
  ];

  const columnsViewActionTable: ColumnsType<UserInventoryHistory> = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) =>
        dayjs(createdAt).format("MMMM Do YYYY, h:mm:ss a"), // Format the date using moment
    },
    {
      title: "Operation",
      dataIndex: "operationType",
      key: "operationType",
    },
    {
      title: "Component SN",
      dataIndex: "componentSerialNumber",
      key: "componentSerialNumber",
    },
  ];

  return (
    <div>
      <h2>Users</h2>
      <Table
        className="border"
        columns={columns}
        dataSource={users}
        rowKey="id"
        loading={loading}
        pagination={{ current: currentPage, onChange: handlePageChange }}
      />
      <Modal
        title="Inventory History"
        visible={historyVisible}
        onCancel={handleHistoryModalClose}
        onOk={handleHistoryModalClose}
        footer={
          <Button type="primary" onClick={handleHistoryModalClose}>
            OK
          </Button>
        }
      >
        {inventoryHistory.length > 0 ? (
          <Table
            dataSource={inventoryHistory}
            columns={columnsViewActionTable}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <p>No history available for this user.</p>
        )}
      </Modal>
    </div>
  );
};

export default Users;
