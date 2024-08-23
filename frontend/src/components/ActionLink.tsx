import React from "react";

interface ActionLinkProps {
  onClick: () => void;
  icon: React.ReactNode;
  text: string;
}

export const ActionLink: React.FC<ActionLinkProps> = ({
  onClick,
  icon,
  text,
}) => (
  <a onClick={onClick} href="#/">
    {icon} {text}
  </a>
);
