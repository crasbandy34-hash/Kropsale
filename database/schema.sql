-- ============================================================
-- Krop Sale · Esquema para Turso (SQLite/LibSQL)
-- Pega este archivo completo en el editor SQL de tu base Turso
-- (o ejecútalo con: turso db shell <nombre_db> < database/schema.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  module TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  location TEXT,
  profile_image TEXT,
  role_id INTEGER NOT NULL,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS condition (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS status (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS category (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  condition_id INTEGER NOT NULL,
  status_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  category_id INTEGER NOT NULL,
  origin TEXT,
  harvest_date TEXT,
  expiration_date TEXT,
  certifications TEXT,
  unit TEXT DEFAULT 'Unidad',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS product_image (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  is_main INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  buyer_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  sent_at TEXT DEFAULT (datetime('now')),
  is_read INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sales (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  buyer_id INTEGER NOT NULL,
  seller_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price_at_purchase NUMERIC,
  status TEXT DEFAULT 'Pendiente',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS favorites (
  user_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id)
);

CREATE TABLE IF NOT EXISTS calls (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  caller_id INTEGER NOT NULL,
  callee_id INTEGER NOT NULL,
  type TEXT NOT NULL DEFAULT 'voice',
  status TEXT NOT NULL DEFAULT 'ringing',
  started_at TEXT DEFAULT (datetime('now')),
  answered_at TEXT,
  ended_at TEXT
);

CREATE TABLE IF NOT EXISTS ratings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sale_id INTEGER NOT NULL,
  reviewer_id INTEGER NOT NULL,
  reviewee_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- ============================================================
-- Datos semilla (roles, permisos, categorías, condiciones, estados)
-- ============================================================

INSERT OR IGNORE INTO roles (id, name, description) VALUES
  (1, 'Administrador', 'Acceso completo'),
  (2, 'Vendedor', 'Gestiona productos y ventas'),
  (3, 'Comprador', 'Compra y reseñas');

INSERT OR IGNORE INTO permissions (id, name, module) VALUES
  (1,  'dashboard.view',       'dashboard'),
  (2,  'users.view',           'users'),
  (3,  'users.create',         'users'),
  (4,  'users.edit',           'users'),
  (5,  'users.delete',         'users'),
  (6,  'roles.view',           'roles'),
  (7,  'roles.edit',           'roles'),
  (8,  'products.view',        'products'),
  (9,  'products.create',      'products'),
  (10, 'products.edit',        'products'),
  (11, 'products.delete',      'products'),
  (12, 'sales.view',           'sales'),
  (13, 'reports.view',         'reports'),
  (14, 'classifications.view', 'classifications'),
  (15, 'settings.view',        'settings'),
  (16, 'settings.edit',        'settings');

-- Administrador: todos los permisos
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Vendedor: todo excepto usuarios, roles, reportes, clasificaciones y settings.edit
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions
WHERE name NOT LIKE 'users.%' AND name NOT LIKE 'roles.%'
  AND name != 'reports.view' AND name != 'classifications.view' AND name != 'settings.edit';

-- Comprador: ver productos, ventas y settings
INSERT OR IGNORE INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions
WHERE name IN ('products.view', 'sales.view', 'settings.view');

INSERT OR IGNORE INTO category (id, name, description) VALUES
  (1, 'Frutas', NULL),
  (2, 'Verduras', NULL),
  (3, 'Granos', NULL),
  (4, 'Semillas', NULL),
  (5, 'Herramientas', NULL);

INSERT OR IGNORE INTO condition (id, name, description) VALUES
  (1, 'Nuevo', NULL),
  (2, 'Como nuevo', NULL),
  (3, 'Usado', NULL);

INSERT OR IGNORE INTO status (id, name, description) VALUES
  (1, 'Disponible', NULL),
  (2, 'Vendido', NULL),
  (3, 'Reservado', NULL);