import React, { useEffect, useState } from "react";
import { Table, Tag, message, Modal, Button, Form, Input, Select } from "antd";
import { EditOutlined } from "@ant-design/icons";
import client from "../client/client";
import capitalize from "antd/lib/_util/capitalize";
import { ComponentType } from "../types";
import { attributeOptions } from "../constants";
import { ModalFooterButtons } from "../components";
import "../styles/ComponentBorder.css";

const { Option } = Select;

const Types: React.FC = () => {
  const [types, setTypes] = useState<ComponentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedType, setSelectedType] = useState<ComponentType | null>(null);
  const [form] = Form.useForm();
  const [currentPage, setCurrentPage] = useState<number>(1);

  useEffect(() => {
    const storedPage = localStorage.getItem("currentPage");
    if (storedPage) {
      setCurrentPage(Number(storedPage));
    }

    const fetchTypes = async () => {
      try {
        const response = await client.get("types");
        setTypes(response.data);
      } catch (error) {
        console.error("Error fetching types:", error);
        message.error("Failed to fetch types");
      } finally {
        setLoading(false);
      }
    };

    fetchTypes();

    return () => {
      localStorage.removeItem("currentPage");
    };
  }, []);

  const showEditModal = (type: ComponentType) => {
    setSelectedType(type);
    form.setFieldsValue(type);
    setEditModalVisible(true);
  };

  const handleEdit = async (values: ComponentType) => {
    if (!selectedType) return;

    try {
      await client.put(`types/${selectedType.id}`, values);
      setTypes((prevTypes) =>
        prevTypes.map((type) =>
          type.id === selectedType.id ? { ...type, ...values } : type,
        ),
      );
      message.success("Type updated successfully");
      setEditModalVisible(false);
    } catch (error) {
      console.error("Error updating type:", error);
      message.error("Failed to update type");
    }
  };

  const handleDelete = async () => {
    if (!selectedType) return;

    try {
      await client.delete(`types/${selectedType.id}`);
      setTypes((prevTypes) =>
        prevTypes.filter((type) => type.id !== selectedType.id),
      );
      message.success("Type deleted successfully");
      setEditModalVisible(false);
    } catch (error) {
      console.error("Error deleting type:", error);
      message.error(
        "Failed to delete type. Check if there is an item with that type.",
      );
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem("currentPage", page.toString());
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
    },
    {
      title: "Attributes",
      dataIndex: "attributes",
      key: "attributes",
      render: (attributes: string[]) => (
        <>
          {attributes.map((attribute) => (
            <Tag color="blue" key={attribute}>
              {capitalize(attribute.replace("_", " "))}
            </Tag>
          ))}
        </>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: ComponentType) => (
        <Button icon={<EditOutlined />} onClick={() => showEditModal(record)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div>
      <h2>Item Types</h2>
      <Table
        className="border"
        columns={columns}
        dataSource={types}
        rowKey="id"
        loading={loading}
        pagination={{ current: currentPage, onChange: handlePageChange }}
      />

      <Modal
        title="Edit Type"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={
          <ModalFooterButtons
            onCancel={() => setEditModalVisible(false)}
            onDelete={handleDelete}
            onSave={() => {
              form
                .validateFields()
                .then((values) => {
                  form.resetFields();
                  handleEdit(values);
                })
                .catch((info) => {
                  console.log("Validate Failed:", info);
                });
            }}
          />
        }
      >
        <Form
          form={form}
          layout="vertical"
          name="edit_type_form"
          initialValues={selectedType || undefined} // Set initialValues only if selectedType is not null
        >
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Please input the name!" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="attributes"
            label="Attributes"
            rules={[
              { required: true, message: "Please select the attributes!" },
            ]}
          >
            <Select mode="multiple" placeholder="Select attributes">
              {attributeOptions.map((option) => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Types;
