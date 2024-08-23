CREATE TYPE component_status AS ENUM ('Being Used', 'Out of Inventory', 'Ready to Use');
CREATE TYPE component_condition AS ENUM ('Functioning', 'Slightly Damaged', 'Broken');
CREATE TYPE inventory_operation_type AS ENUM ('Assigned', 'Returned', 'Added', 'Deactivated', 'Activated');

CREATE TABLE component_types (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    attributes TEXT[] NOT NULL DEFAULT ARRAY['status', 'condition']
);

CREATE TABLE components (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status component_status NOT NULL DEFAULT 'Ready to Use',
    brand TEXT,
    model TEXT,
    model_year INT,
    type_id INT NOT NULL REFERENCES component_types(id),
    screen_size TEXT,
    resolution TEXT,
    processor_type TEXT,
    processor_cores INT,
    ram INT,
    warranty_end_date TIMESTAMP WITH TIME ZONE,
    serial_number TEXT UNIQUE,
    condition component_condition NOT NULL,
    notes TEXT,
    email_notified BOOLEAN
);

CREATE TABLE inventory_history (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    component_id INT NOT NULL REFERENCES components(id),
    user_id TEXT NOT NULL,
    operation_type inventory_operation_type NOT NULL,
    user_name TEXT
);

CREATE INDEX idx_component_status ON components(status);
CREATE INDEX idx_component_type_id ON components(type_id);
CREATE INDEX idx_component_condition ON components(condition);