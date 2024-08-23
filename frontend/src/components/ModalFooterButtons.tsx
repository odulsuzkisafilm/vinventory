import React from "react";
import { Button } from "antd";
import { DeleteOutlined } from "@ant-design/icons";

export const ModalFooterButtons: React.FC<{
  onCancel: () => void;
  onDelete: () => void;
  onSave: () => void;
}> = ({ onCancel, onDelete, onSave }) => (
  <>
    <Button key="cancel" onClick={onCancel}>
      Cancel
    </Button>
    <Button
      key="delete"
      type="primary"
      danger
      icon={<DeleteOutlined />}
      onClick={onDelete}
    >
      Delete
    </Button>
    <Button key="submit" type="primary" onClick={onSave}>
      Save
    </Button>
  </>
);
