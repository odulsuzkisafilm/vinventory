import { useEffect, useState } from "react";
import { Form, Button, Select, message } from "antd";
import client from "../client/client";
import { FormItemsConfig } from "../constants/FormItemsConfig";
import CustomFormItem from "../components/CustomFormItem";
import "../styles/NewItem.css";
import { NewItemForm, ComponentType, BodyType } from "../types";
import NotificationUtil from "../components/NotificationUtil";

const { Option } = Select;

const NewItem = ({ currentUserData }: BodyType) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [componentTypes, setComponentTypes] = useState<ComponentType[]>([]);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>([]);

  useEffect(() => {
    const fetchComponentTypes = async () => {
      try {
        const response = await client.get("types");
        setComponentTypes(response.data);
      } catch (error) {
        console.error("Error fetching component types:", error);
        message.error("Failed to fetch component types");
      }
    };

    fetchComponentTypes();
  }, []);

  const onFinish = async (values: NewItemForm) => {
    setLoading(true);

    try {
      const formattedValues = {
        ...values,
        warrantyEndDate: values.warrantyEndDate.toISOString(),
        processorCores:
          values.processorCores !== undefined &&
          values.processorCores !== null &&
          values.processorCores.toString().trim() !== ""
            ? parseInt(values.processorCores.toString(), 10)
            : null,
        modelYear:
          values.modelYear !== undefined &&
          values.modelYear !== null &&
          values.modelYear.toString().trim() !== ""
            ? parseInt(values.modelYear.toString(), 10)
            : null,
        ram:
          values.ram !== undefined &&
          values.ram !== null &&
          values.ram.toString().trim() !== ""
            ? parseInt(values.ram.toString(), 10)
            : null,
      };

      const requestPayload = {
        component: formattedValues,
        userId: currentUserData?.id,
      };

      await client.post("components", requestPayload);

      NotificationUtil.showSuccessNotification("Item");
      form.resetFields();
    } catch (error) {
      NotificationUtil.showFailNotification("Item");
    } finally {
      setLoading(false);
    }
  };

  const onFinishFailed = () => {
    const headerHeight = document.querySelector(".header")?.clientHeight || 0;
    const formElement = document.querySelector(".ant-form");
    if (formElement) {
      const formPosition =
        formElement.getBoundingClientRect().top + window.scrollY;

      window.scrollTo({
        top: formPosition - headerHeight - 10,
        behavior: "smooth",
      });
    }
    message.error("Please complete all required fields!");
  };

  const handleTypeChange = (typeId: number) => {
    const selectedType = componentTypes.find((type) => type.id === typeId);
    if (selectedType) {
      setSelectedAttributes(selectedType.attributes);
    }
  };

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={onFinish}
      onFinishFailed={onFinishFailed}
      initialValues={{ status: "Ready to Use", condition: "Functioning" }}
    >
      <Form.Item
        name="typeId"
        label="Type"
        rules={[{ required: true, message: "Please select the type!" }]}
        className="customFormItem"
      >
        <Select onChange={handleTypeChange}>
          {componentTypes.map((type) => (
            <Option key={type.id} value={type.id}>
              {type.name}
            </Option>
          ))}
        </Select>
      </Form.Item>

      {FormItemsConfig.map((item) => (
        <CustomFormItem
          key={item.name}
          name={item.name}
          label={item.label}
          required={selectedAttributes.includes(item.name)}
          inputType={item.inputType}
          selectOptions={item.selectOptions}
          datepicker={item.datepicker}
          textArea={item.textArea}
        />
      ))}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Add Item
        </Button>
      </Form.Item>
    </Form>
  );
};

export default NewItem;
