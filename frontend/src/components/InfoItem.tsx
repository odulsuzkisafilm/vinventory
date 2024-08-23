import React from "react";

export const InfoItem = ({
  label,
  value,
}: {
  label: string;
  value: string | number | React.ReactNode | null | undefined;
}) => (
  <p>
    <strong>{label}:</strong> {value ?? "N/A"}
  </p>
);
