import { Button } from "antd";
import React from "react";

interface ModalButtonProps {
  onClick: () => void;
  type?: "default" | "primary";
  danger?: boolean;
  ghost?: boolean;
  text: string;
  key: string;
  disabled?: boolean;
}

export const ModalButton: React.FC<ModalButtonProps> = ({
  onClick,
  type = "default",
  danger = false,
  ghost = false,
  text,
  key,
  disabled = false,
}) => (
  <Button
    key={key}
    type={type}
    onClick={onClick}
    ghost={ghost}
    danger={danger}
    disabled={disabled}
  >
    {text}
  </Button>
);
