import React, { useState } from "react";
import { Form, Input, Button, Select } from "antd";
import client from "../client/client";
import { NewComponentTypeForm } from "../types";
import { attributeOptions } from "../constants";
import NotificationUtil from "../components/NotificationUtil";

const { Option } = Select;

const NewType: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: NewComponentTypeForm) => {
    setLoading(true);

    try {
      await client.post("types", values);
      NotificationUtil.showSuccessNotification("Type");
      form.resetFields();
    } catch (error) {
      console.error("Error creating component type:", error);
      NotificationUtil.showFailNotification("Type");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item
        name="name"
        label="Name"
        rules={[{ required: true, message: "Please input the name!" }]}
      >
        <Input />
      </Form.Item>

      <Form.Item name="attributes" label="Attributes">
        <Select mode="multiple" placeholder="Select attributes">
          {attributeOptions.map((option) => (
            <Option key={option.value} value={option.value}>
              {option.label}
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Add Component Type
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewType;
