-- EXTENSIONS --
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- SEQUENCES --
CREATE SEQUENCE IF NOT EXISTS products_seq;

--- TABLES ---

CREATE TABLE IF NOT EXISTS tenants (
  id UUID NOT NULL DEFAULT uuid_generate_v4(),
  store_name VARCHAR(63) NOT NULL UNIQUE,
  fullname VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(64) CHECK (status IN ('active', 'suspended', 'disabled')) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS products (
  id INT NOT NULL DEFAULT NEXTVAL ('products_seq'),
  tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  sale_price NUMERIC DEFAULT 0,
  compare_price NUMERIC DEFAULT 0,
  quantity INTEGER DEFAULT 0,
  product_description TEXT NOT NULL,
  published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (compare_price > sale_price OR compare_price = 0),
  PRIMARY KEY (id)
);

-- RLS POLICIES -- 
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON tenants 
USING (store_name = current_setting('app.current_tenant_name')::VARCHAR(63));

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
CREATE POLICY product_isolation_policy ON products 
USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- INDEXES --
CREATE INDEX idx_tenant_id ON products (tenant_id);

-- Permissions --
CREATE USER crud_user WITH PASSWORD 'crud_password';
-- Allow crud user to connect to the development databaase
GRANT CONNECT ON DATABASE development TO crud_user;
-- Allow crud user to use public schema
GRANT USAGE ON SCHEMA public TO crud_user;
-- Allow crud user to select, insert, update and delete on all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO crud_user;
-- Allow crud user to select and update on all the sequences in schema public
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO crud_user;