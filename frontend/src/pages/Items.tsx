import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  Space,
  Table,
  Tag,
  Modal,
  Select,
  message,
  Button,
  Dropdown,
  Menu,
  Input,
  Upload,
  Image,
} from "antd";
import {
  InfoCircleOutlined,
  HistoryOutlined,
  UserSwitchOutlined,
  EditOutlined,
  DownOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import client from "../client/client";
import { Status, Condition, SortOption } from "../constants";
import { Component, User, ComponentType, InventoryHistory } from "../types";
import {
  EditComponent,
  ActionLink,
  ModalButton,
  InfoItem,
} from "../components";
import { FilterValues } from "../types/FilterInterfaces";
import "../styles/ComponentBorder.css";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import "../styles/SearchButton.css";
import "../styles/DropDown.css";
import "../styles/Items.css";
import { AccountInfo } from "../types/AccountInfo";
import debounce from "lodash/debounce";
import NotificationUtil from "../components/NotificationUtil";
import { AxiosError } from "axios";

const { Option } = Select;

interface ItemsProps {
  filters: FilterValues;
  currentUserData?: AccountInfo | null;
}

const Items: React.FC<ItemsProps> = ({
  filters,
  currentUserData,
}: ItemsProps) => {
  const [data, setData] = useState<Component[]>([]);
  const [loading, setLoading] = useState(true);
  const [aboutComponent, setAboutComponent] = useState<Component | null>(null);
  const [assignComponent, setAssignComponent] = useState<Component | null>(
    null,
  );
  const [lastInteractant, setLastInteractant] = useState<User | null>(null);
  const [componentType, setComponentType] = useState<ComponentType | null>(
    null,
  );
  const [inventoryHistory, setInventoryHistory] = useState<InventoryHistory[]>(
    [],
  );
  const [historyVisible, setHistoryVisible] = useState(false);
  const [assignVisible, setAssignVisible] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [hasErrors, setHasErrors] = useState<boolean>(false);
  const [sort, setSort] = useState<string>("");
  const [order, setOrder] = useState<string>("asc");
  const [searchInput, setSearchInput] = useState<string>("");
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [fileList, setFileList] = useState<any[]>([]);
  const [componentImages, setComponentImages] = useState<string[]>([]);
  const [userNames, setUserNames] = useState<{ [key: number]: string }>({});

  const constructQueryParams = (
    filters: FilterValues,
    searchInput?: string,
    sort?: string,
    order?: string,
  ) => {
    const queryParams = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) {
        queryParams.append(key, value.toString());
      }
    });
    if (searchInput) queryParams.append("search", searchInput);
    if (sort) queryParams.append("sort", sort);
    if (order) queryParams.append("order", order);

    return queryParams.toString();
  };

  const fetchData = useCallback(
    async (searchInput: string) => {
      setLoading(true);
      try {
        const queryParams = constructQueryParams(
          filters,
          searchInput,
          sort,
          order,
        );
        const url = `components?${queryParams}`;
        const response = await client.get(url);
        const components = response.data;

        // Fetch last interactant user for each component if status is 'Being Used'
        const componentsWithUser = await Promise.all(
          components.map(async (component: Component) => {
            if (component.status === Status.BeingUsed) {
              try {
                const lastInteractantResponse = await client.get(
                  `components/${component.id}/last-interactant`,
                );
                component.user =
                  lastInteractantResponse.data.lastInteractantUser;
              } catch (error) {
                console.error(
                  `Error fetching last interactant for component ${component.id}:`,
                  error,
                );
              }
            } else {
              component.user = null;
            }
            return component;
          }),
        );

        setData(componentsWithUser);
      } catch (error) {
        console.error("Error fetching components:", error);
      } finally {
        setLoading(false);
      }
    },
    [filters, sort, order],
  );
  const debouncedFetchData = useMemo(
    () => debounce(fetchData, 300),
    [fetchData],
  );

  const fetchUserNames = async () => {
    try {
      const usersResponse = await client.post("auth/users");
      const usersData = usersResponse.data.reduce((acc: any, user: User) => {
        acc[user.id] = user.displayName;
        return acc;
      }, {});
      setUserNames(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  useEffect(() => {
    const storedPage = localStorage.getItem("currentPage");
    if (storedPage) {
      setCurrentPage(Number(storedPage));
    }

    debouncedFetchData(searchInput);
    fetchUserNames();

    return () => {
      localStorage.removeItem("currentPage");
    };
  }, [filters, sort, order, searchInput, debouncedFetchData]);

  const handleError = (error: unknown, contextMessage: string) => {
    if (error instanceof AxiosError) {
      if (error.response && error.response.status === 500) {
        console.error(`Server error occurred while ${contextMessage}:`, error);
      } else {
        console.error(`Error occurred while ${contextMessage}:`, error);
      }
    } else {
      console.error(
        `An unexpected error occurred while ${contextMessage}:`,
        error,
      );
    }
  };

  const showComponentDetails = async (component: Component) => {
    setAboutComponent(component);

    try {
      const componentTypeResponse = await client.get(
        `types/${component.typeId}`,
      );
      setComponentType(componentTypeResponse.data);
    } catch (error) {
      handleError(error, "fetching component type");
    }

    if (component.status === Status.BeingUsed) {
      try {
        const lastInteractantResponse = await client.get(
          `components/${component.id}/last-interactant`,
        );
        setLastInteractant(lastInteractantResponse.data.lastInteractantUser);
      } catch (error) {
        handleError(error, "fetching last interactant");
      }
    } else {
      setLastInteractant(null); // No user if not being used
    }

    try {
      const imagesResponse = await client.get(
        `components/${component.id}/image`,
      );
      setComponentImages(imagesResponse.data.images || []);
    } catch (error) {
      handleError(error, "fetching images");
    }
  };

  const showInventoryHistory = async (componentId: number) => {
    try {
      const response = await client.get(
        `components/${componentId}/inventory-history`,
      );
      const history = response.data;

      // Fetch user details for each history entry
      const historyWithUserDetails = await Promise.all(
        history.map(async (entry: InventoryHistory) => {
          try {
            const userResponse = await client.get(`auth/users/${entry.userId}`);
            entry.user = userResponse.data;
          } catch (error) {
            console.error(
              `Error fetching user details for history entry ${entry.id}:`,
              error,
            );
          }
          return entry;
        }),
      );

      // Sort history by createdAt date from new to old
      historyWithUserDetails.sort(
        (a, b) => dayjs(b.createdAt).valueOf() - dayjs(a.createdAt).valueOf(),
      );

      setInventoryHistory(historyWithUserDetails);
      setHistoryVisible(true);
    } catch (error) {
      console.error("Error fetching inventory history:", error);
    }
  };

  const showAssignModal = async (component: Component) => {
    setAssignComponent(component);
    setSelectedUser(null); // Reset selected user
    try {
      const response = await client.post("auth/users");
      setUsers(response.data);
      setAssignVisible(true);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleAssign = async () => {
    if (!assignComponent || !selectedUser) {
      message.error("Please select a user.");
      return;
    }

    try {
      const inventoryHistoryEntry: InventoryHistory = {
        id: 0,
        createdAt: new Date().toISOString(),
        componentId: assignComponent.id,
        userId: selectedUser,
        operationType: "Assigned",
        userName: "",
      };

      await client.post("inventory-history", inventoryHistoryEntry);
      message.success("Component assigned successfully.");
      setAssignVisible(false);
      setSelectedUser(null);
      await fetchData(searchInput); // Refresh component data
    } catch (error) {
      console.error("Error assigning component:", error);
      message.error("Failed to assign component.");
    }
  };

  const handleDeassign = async (component: Component) => {
    if (!component.user) {
      message.error("Component has no assigned user.");
      return;
    }

    try {
      const inventoryHistoryEntry: InventoryHistory = {
        id: 0,
        createdAt: new Date().toISOString(),
        componentId: component.id,
        userId: component.user.id,
        operationType: "Returned",
        userName: "",
      };

      await client.post("inventory-history", inventoryHistoryEntry);
      message.success("Component returned successfully.");
      await fetchData(searchInput); // Refresh component data
    } catch (error) {
      console.error("Error deassigning component:", error);
      message.error("Failed to return component.");
    }
  };

  const editComponentDetails = (component: Component) => {
    setEditMode(true);
    showComponentDetails(component);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    if (aboutComponent) {
      setAboutComponent({
        ...aboutComponent,
        [name]: value !== "" ? value : null,
      });
    }
  };

  const handleDateChange = (date: dayjs.Dayjs | null) => {
    if (aboutComponent) {
      setAboutComponent({
        ...aboutComponent,
        warrantyEndDate: date ? date.toISOString() : "",
      });
    }
  };

  const handleConditionChange = (value: Condition) => {
    if (aboutComponent) {
      setAboutComponent({
        ...aboutComponent,
        condition: value,
      });
    }
  };

  const handleUploadChange = (info: any) => {
    setUploadedFiles(info.fileList);
    setFileList(info.fileList);
  };

  const handleSaveChanges = async () => {
    if (aboutComponent) {
      try {
        const updatedComponent: Component = {
          ...aboutComponent,
          modelYear:
            aboutComponent.modelYear !== undefined &&
            aboutComponent.modelYear !== null &&
            aboutComponent.modelYear.toString().trim() !== ""
              ? parseInt(aboutComponent.modelYear.toString(), 10)
              : null,
          processorCores:
            aboutComponent.processorCores !== undefined &&
            aboutComponent.processorCores !== null &&
            aboutComponent.processorCores.toString().trim() !== ""
              ? parseInt(aboutComponent.processorCores.toString(), 10)
              : null,
          ram:
            aboutComponent.ram !== undefined &&
            aboutComponent.ram !== null &&
            aboutComponent.ram.toString().trim() !== ""
              ? parseInt(aboutComponent.ram.toString(), 10)
              : null,
        };

        await client.put(`components/${aboutComponent.id}`, updatedComponent);

        if (uploadedFiles.length > 0) {
          const formData = new FormData();
          uploadedFiles.forEach((file) => {
            formData.append("image", file.originFileObj);
          });

          await client.post(`components/${aboutComponent.id}/image`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          });
          NotificationUtil.showSuccessNotification("Image");
        }

        setData((prevData) =>
          prevData.map((component) =>
            component.id === aboutComponent.id ? updatedComponent : component,
          ),
        );
        setEditMode(false);
        setFileList([]);
        setUploadedFiles([]);
        setComponentImages([]);
        setAboutComponent(null);
      } catch (error) {
        console.error("Error saving changes:", error);
        NotificationUtil.showFailNotification("Item");
      }
    }
  };

  const handleErrorChange = (errors: boolean) => {
    setHasErrors(errors);
  };

  const handleItemStatus = async () => {
    if (aboutComponent) {
      try {
        switch (aboutComponent.status) {
          case Status.OutOfInventory:
            await client.put(
              `components/${aboutComponent.id}/activate/${currentUserData?.id}`,
            );
            break;
          case Status.ReadyToUse:
          case Status.BeingUsed:
            await client.put(
              `components/${aboutComponent.id}/deactivate/${currentUserData?.id}`,
            );
            break;
          default:
            break;
        }
        fetchData(searchInput);
        setEditMode(false);
        setAboutComponent(null);
      } catch (error) {
        console.error("Error while activating item:", error);
      }
    }
  };

  const handleAboutModalClose = () => {
    setAboutComponent(null);
    setEditMode(false);
    setLastInteractant(null);
    setComponentType(null);
    setFileList([]);
    setUploadedFiles([]);
    setComponentImages([]);
  };

  const handleHistoryModalClose = () => {
    setHistoryVisible(false);
  };

  const handleAssignModalClose = () => {
    setAssignVisible(false);
    setSelectedUser(null);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem("currentPage", page.toString());
  };

  const isWarrantyExpired = (warrantyEndDate: string) =>
    dayjs().isAfter(warrantyEndDate);

  const columns = [
    {
      title: "Serial Number",
      dataIndex: "serialNumber",
      key: "serialNumber",
    },
    {
      title: "Brand",
      dataIndex: "brand",
      key: "brand",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
    },
    {
      title: "Condition",
      key: "condition",
      dataIndex: "condition",
      render: (condition: Condition) => {
        let color;
        switch (condition) {
          case Condition.Functioning:
            color = "green";
            break;
          case Condition.SlightlyDamaged:
            color = "geekblue";
            break;
          case Condition.Broken:
            color = "red";
            break;
          default:
            color = "gray";
        }
        return (
          <Tag color={color} key={condition}>
            {condition}
          </Tag>
        );
      },
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      render: (status: Status) => {
        let color;
        switch (status) {
          case Status.OutOfInventory:
            color = "gray";
            break;
          case Status.BeingUsed:
            color = "blue";
            break;
          case Status.ReadyToUse:
            color = "lightgreen";
            break;
          default:
            color = "lightgreen";
        }
        return (
          <Tag color={color} key={status}>
            {status}
          </Tag>
        );
      },
    },
    {
      title: "User",
      key: "user",
      render: (record: Component) => {
        if (record.status === Status.BeingUsed) {
          return record.user
            ? `${record.user.displayName}`
            : userNames[record.id] || "-";
        } else {
          return "-";
        }
      },
    },
    {
      title: "Actions",
      key: "action",
      render: (record: Component) => (
        <Space size="middle">
          <ActionLink
            onClick={() => showComponentDetails(record)}
            icon={<InfoCircleOutlined />}
            text="About"
          />
          <ActionLink
            onClick={() => showInventoryHistory(record.id)}
            icon={<HistoryOutlined />}
            text="History"
          />
          {record.status === Status.BeingUsed ? (
            <ActionLink
              onClick={() => handleDeassign(record)}
              icon={<UserSwitchOutlined />}
              text="Return"
            />
          ) : (
            <ActionLink
              onClick={() => showAssignModal(record)}
              icon={<UserSwitchOutlined />}
              text="Assign"
            />
          )}
          <ActionLink
            onClick={() => editComponentDetails(record)}
            icon={<EditOutlined />}
            text="Edit"
          />
        </Space>
      ),
    },
  ];

  const details = [
    { label: "Serial Number", value: aboutComponent?.serialNumber },
    { label: "Brand", value: aboutComponent?.brand },
    { label: "Model", value: aboutComponent?.model },
    {
      label: "Model Year",
      value:
        aboutComponent?.modelYear !== null ? aboutComponent?.modelYear : "",
    },
    { label: "Item Type", value: componentType?.name || "" },
    { label: "Screen Size", value: aboutComponent?.screenSize },
    { label: "Resolution", value: aboutComponent?.resolution },
    { label: "Processor Type", value: aboutComponent?.processorType },
    {
      label: "Processor Cores",
      value:
        aboutComponent?.processorCores !== null
          ? aboutComponent?.processorCores
          : "",
    },
    {
      label: "RAM",
      value: aboutComponent?.ram !== null ? aboutComponent?.ram : "",
    },
    {
      label: "Warranty End Date",
      value: `${dayjs(aboutComponent?.warrantyEndDate).format("MMMM Do YYYY, h:mm:ss a")} ${
        aboutComponent && isWarrantyExpired(aboutComponent.warrantyEndDate)
          ? "(Expired)"
          : ""
      }`,
    },
    { label: "Condition", value: aboutComponent?.condition },
    { label: "Status", value: aboutComponent?.status },
    {
      label: "Assigned User's Name",
      value: lastInteractant
        ? lastInteractant.firstName
          ? `${lastInteractant.firstName} ${lastInteractant.lastName}`
          : "DELETED USER"
        : "N/A",
    },
    {
      label: "Assigned User's Email",
      value: lastInteractant
        ? lastInteractant.email
          ? lastInteractant.email
          : "DELETED USER"
        : "N/A",
    },
    { label: "Notes", value: aboutComponent?.notes },
  ];

  const columnsHistoryTable: ColumnsType<InventoryHistory> = [
    {
      title: "Date",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (createdAt: string) =>
        dayjs(createdAt).format("MMMM Do YYYY, h:mm:ss a"),
    },
    {
      title: "Operation",
      dataIndex: "operationType",
      key: "operationType",
    },
    {
      title: "User",
      dataIndex: "user",
      key: "user",
      render: (user: User | undefined, record: InventoryHistory) =>
        user ? `${user.displayName}` : record.userName,
    },
  ];

  const getOrderButtonText = () => {
    switch (sort) {
      case SortOption.modelYear:
        return "Order By Model Year";
      case SortOption.processorCores:
        return "Order By Processor Cores";
      case SortOption.ram:
        return "Order By Ram";
      case SortOption.warrantyEndDate:
        return "Order By Warranty End Date";
      default:
        return "Order By";
    }
  };

  const handleMenuClick = (e: { key: string }) => {
    setSort(e.key);
    fetchData(searchInput); // Refresh data with the new order
  };

  const handleOrderChange = () => {
    setOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const getTitle = (component: Component): string => {
    if (component.modelYear && component.brand && component.model) {
      return `${component.modelYear} ${component.brand} ${component.model}`;
    }
    if (component.modelYear && component.model) {
      return `${component.modelYear} ${component.model}`;
    }
    if (component.brand && component.model) {
      return `${component.brand} ${component.model}`;
    }
    if (component.model) {
      return `${component.model}`;
    }
    return `${component.serialNumber}`;
  };

  const getModalTitle = (component: Component, editMode: boolean): string => {
    let title: string = getTitle(component);

    if (editMode) {
      return `Edit ${title}`;
    }
    return `Details of ${title}`;
  };

  const orderIcon = order === "asc" ? "▲" : "▼";

  return (
    <>
      <div className="searchContainer">
        <Input
          placeholder="Search by Serial Number, Brand, Model or User..."
          size="large"
          onChange={handleSearchChange}
          className="searchInput"
        />
        <Dropdown
          className="DropDownOrder"
          overlay={
            <Menu
              onClick={handleMenuClick}
              items={[
                { key: "model_year", label: "Order By Model Year" },
                { key: "processor_cores", label: "Order By Processor Cores" },
                { key: "ram", label: "Order By RAM" },
                {
                  key: "warranty_end_date",
                  label: "Order By Warranty End Date",
                },
              ]}
            ></Menu>
          }
        >
          <Button>
            {getOrderButtonText()} <DownOutlined />
          </Button>
        </Dropdown>
        <Button className="icon-button" onClick={handleOrderChange}>
          {orderIcon}
        </Button>
      </div>
      <Table
        className="border"
        columns={columns}
        dataSource={data}
        rowKey="id"
        loading={loading}
        pagination={{ current: currentPage, onChange: handlePageChange }}
      />
      {aboutComponent && (
        <Modal
          title={getModalTitle(aboutComponent, editMode)}
          open={true}
          onCancel={handleAboutModalClose}
          footer={
            editMode
              ? [
                  <ModalButton
                    key="cancel"
                    onClick={handleAboutModalClose}
                    text="Cancel"
                  />,
                  <ModalButton
                    key={
                      aboutComponent.status === Status.OutOfInventory
                        ? "activate"
                        : "deactivate"
                    }
                    type="primary"
                    onClick={handleItemStatus}
                    text={
                      aboutComponent.status === Status.OutOfInventory
                        ? "Activate"
                        : "Deactivate"
                    }
                    danger={aboutComponent.status !== Status.OutOfInventory}
                    ghost={aboutComponent.status === Status.OutOfInventory}
                  />,
                  <ModalButton
                    key="save"
                    type="primary"
                    onClick={handleSaveChanges}
                    text="Save"
                    disabled={hasErrors}
                  />,
                ]
              : [
                  <ModalButton
                    key="edit"
                    onClick={() => setEditMode(true)}
                    text="Edit Item"
                  />,
                  <ModalButton
                    key="ok"
                    type="primary"
                    onClick={handleAboutModalClose}
                    text="OK"
                  />,
                ]
          }
        >
          {editMode ? (
            <>
              <Upload
                className="upload"
                name="images"
                accept=".png"
                listType="picture"
                multiple
                fileList={fileList}
                onChange={handleUploadChange}
                beforeUpload={() => false}
              >
                <Button icon={<UploadOutlined />}>Upload Images</Button>
              </Upload>
              <EditComponent
                component={aboutComponent}
                componentType={componentType}
                lastInteractant={lastInteractant}
                onChange={handleInputChange}
                onConditionChange={handleConditionChange}
                onDateChange={handleDateChange}
                onErrorChange={handleErrorChange}
              />
            </>
          ) : (
            <>
              {details.map((detail) => (
                <InfoItem
                  key={detail.label}
                  label={detail.label}
                  value={detail.value}
                />
              ))}
              <div className="image-gallery">
                <h3>
                  {componentImages.length > 0
                    ? "Component Images"
                    : "No Images Available"}
                </h3>
                {componentImages.map((image, index) => (
                  <Image
                    key={index}
                    src={image} // Using the pre-signed URL
                    alt={`Component image ${index + 1}`}
                    className="small-image"
                  />
                ))}
              </div>
            </>
          )}
        </Modal>
      )}
      <Modal
        title="Inventory History"
        open={historyVisible}
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
            columns={columnsHistoryTable}
            rowKey="id"
            pagination={false}
          />
        ) : (
          <p>No history available for this component.</p>
        )}
      </Modal>
      <Modal
        title="Assign Component"
        open={assignVisible}
        onCancel={handleAssignModalClose}
        onOk={handleAssign}
      >
        <Select
          showSearch
          placeholder="Select a user"
          style={{ width: "100%" }}
          value={selectedUser} // Ensure selectedUser is controlled
          onChange={(value: string) => setSelectedUser(value)}
          filterOption={(input, option) =>
            option?.props.children.toLowerCase().indexOf(input.toLowerCase()) >=
            0
          }
        >
          {users.map((user: User) => (
            <Option key={user.id} value={user.id}>
              {user.displayName}
            </Option>
          ))}
        </Select>
      </Modal>
    </>
  );
};

export default Items;
