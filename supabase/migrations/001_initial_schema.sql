-- ==============================================================================
-- WOT'S CAFE RESTAURANT POS & ADİSYON SAAS SCHEMA
-- Production PostgreSQL / Supabase Multi-Branch & Multi-Tenant Migration
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ORGANIZATIONS & BRANCHES
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    tax_number VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- e.g. "Silivri Sahil"
    address TEXT,
    phone VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. STAFF & ROLES
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'cashier', 'waiter', 'kitchen', 'bar');

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'waiter',
    pin VARCHAR(10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. FLOORS & TABLES
CREATE TABLE IF NOT EXISTS floors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- "Sahil Teras", "Ana Salon"
    icon VARCHAR(20),
    sort_order INT DEFAULT 0
);

CREATE TYPE table_status AS ENUM ('available', 'occupied', 'payment_waiting', 'reserved', 'cleaning', 'offline');
CREATE TYPE table_shape AS ENUM ('square', 'round', 'rectangle');

CREATE TABLE IF NOT EXISTS restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    floor_id UUID NOT NULL REFERENCES floors(id) ON DELETE CASCADE,
    number INT NOT NULL,
    label VARCHAR(20) NOT NULL, -- "M1", "M2", "B1"
    seats INT DEFAULT 4,
    status table_status DEFAULT 'available',
    guest_count INT DEFAULT 0,
    current_order_id UUID,
    waiter_id UUID REFERENCES staff(id),
    occupied_at TIMESTAMPTZ,
    pos_x FLOAT DEFAULT 0,
    pos_y FLOAT DEFAULT 0,
    shape table_shape DEFAULT 'square'
);

-- 5. MENU & MODIFIERS
CREATE TABLE IF NOT EXISTS menu_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50),
    sort_order INT DEFAULT 0,
    color VARCHAR(100)
);

CREATE TYPE kitchen_station AS ENUM ('kitchen', 'bar', 'dessert', 'coffee');

CREATE TABLE IF NOT EXISTS menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES menu_categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL,
    image_url TEXT,
    station kitchen_station DEFAULT 'kitchen',
    is_available BOOLEAN DEFAULT TRUE,
    preparation_time_minutes INT DEFAULT 12,
    vat_percent NUMERIC(5, 2) DEFAULT 8.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ORDERS & ORDER ITEMS
CREATE TYPE order_status AS ENUM ('open', 'sent', 'preparing', 'ready', 'served', 'paid', 'cancelled');

CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    table_id UUID NOT NULL REFERENCES restaurant_tables(id),
    table_label VARCHAR(20) NOT NULL,
    waiter_id UUID REFERENCES staff(id),
    waiter_name VARCHAR(255),
    status order_status DEFAULT 'open',
    subtotal NUMERIC(10, 2) DEFAULT 0,
    discount NUMERIC(10, 2) DEFAULT 0,
    tax NUMERIC(10, 2) DEFAULT 0,
    total NUMERIC(10, 2) DEFAULT 0,
    guest_count INT DEFAULT 2,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    sent_to_kitchen_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id),
    name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    modifiers JSONB DEFAULT '[]'::jsonb,
    notes TEXT,
    status order_status DEFAULT 'open',
    station kitchen_station DEFAULT 'kitchen',
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES staff(id)
);

-- 7. KITCHEN TICKETS
CREATE TYPE ticket_status AS ENUM ('new', 'preparing', 'ready', 'completed');

CREATE TABLE IF NOT EXISTS kitchen_tickets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    table_label VARCHAR(20) NOT NULL,
    station kitchen_station NOT NULL,
    items JSONB NOT NULL,
    status ticket_status DEFAULT 'new',
    priority BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);

-- 8. PAYMENTS
CREATE TYPE payment_method AS ENUM ('cash', 'credit_card', 'debit_card', 'sodexo', 'multinet', 'ticket', 'metropol', 'ikram');

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES orders(id),
    table_label VARCHAR(20) NOT NULL,
    parts JSONB NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    change NUMERIC(10, 2) DEFAULT 0,
    paid_at TIMESTAMPTZ DEFAULT NOW(),
    processed_by UUID REFERENCES staff(id)
);

-- 9. INVENTORY & RECIPES
CREATE TABLE IF NOT EXISTS inventory_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    unit VARCHAR(20) NOT NULL, -- "kg", "lt", "adet"
    current_stock NUMERIC(10, 3) DEFAULT 0,
    minimum_stock NUMERIC(10, 3) DEFAULT 0,
    purchase_cost NUMERIC(10, 2) NOT NULL,
    supplier VARCHAR(255),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    menu_item_id UUID NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
    menu_item_name VARCHAR(255) NOT NULL,
    items JSONB NOT NULL, -- [{ inventoryItemId, quantity, unit }]
    total_cost NUMERIC(10, 2) DEFAULT 0
);

-- 10. AUDIT LOG (CRITICAL FOR OWNERS)
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    user_id UUID REFERENCES staff(id),
    user_name VARCHAR(255) NOT NULL,
    action VARCHAR(255) NOT NULL,
    details TEXT,
    entity_type VARCHAR(100),
    entity_id VARCHAR(100),
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE kitchen_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Fast index optimization
CREATE INDEX IF NOT EXISTS idx_tables_branch_floor ON restaurant_tables(branch_id, floor_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_status ON orders(table_id, status);
CREATE INDEX IF NOT EXISTS idx_kitchen_tickets_station ON kitchen_tickets(station, status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(branch_id, timestamp DESC);
