// @ts-nocheck
import path from 'path'
import fs from 'fs'

const DB_PATH = path.join(process.cwd(), 'data', 'kopsale.db')

const SCHEMA = `
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
)
`

const DEFAULT_ROLES = [
  { name: 'Administrador', description: 'Acceso completo' },
  { name: 'Vendedor', description: 'Gestiona productos y ventas' },
  { name: 'Comprador', description: 'Compra y reseñas' },
]

const DEFAULT_PERMISSIONS = [
  { name: 'dashboard.view', module: 'dashboard' },
  { name: 'users.view', module: 'users' },
  { name: 'users.create', module: 'users' },
  { name: 'users.edit', module: 'users' },
  { name: 'users.delete', module: 'users' },
  { name: 'roles.view', module: 'roles' },
  { name: 'roles.edit', module: 'roles' },
  { name: 'products.view', module: 'products' },
  { name: 'products.create', module: 'products' },
  { name: 'products.edit', module: 'products' },
  { name: 'products.delete', module: 'products' },
  { name: 'sales.view', module: 'sales' },
  { name: 'reports.view', module: 'reports' },
  { name: 'classifications.view', module: 'classifications' },
  { name: 'settings.view', module: 'settings' },
  { name: 'settings.edit', module: 'settings' },
]

export function isTursoMode(): boolean {
  return !!process.env.TURSO_URL
}

export function assertDbReady(): void {
  if (!isTursoMode() && process.env.NODE_ENV === 'production') {
    throw new Error('TURSO_URL no configurado en producción. En Vercel usa Turso; sql.js solo es para desarrollo local.')
  }
}

// ---------------------------------------------------------------------------
// Modo Turso (producción / Vercel)
// ---------------------------------------------------------------------------

let clientPromise: Promise<any> | null = null

function rowToObj(r: any): any {
  if (!r) return r
  if (typeof r.toJSON === 'function') return r.toJSON()
  if (typeof r === 'object') return r
  return r
}

function getClient() {
  if (!clientPromise) {
    clientPromise = (async () => {
      const { createClient } = await import('@libsql/client')
      const client = createClient({
        url: process.env.TURSO_URL!,
        authToken: process.env.TURSO_AUTH_TOKEN || undefined,
      })
      await ensureTursoSchema(client)
      return client
    })()
    clientPromise.catch(() => {
      clientPromise = null
    })
  }
  return clientPromise
}

function splitStatements(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

async function ensureTursoSchema(client: any) {
  for (const stmt of splitStatements(SCHEMA)) {
    await client.execute(stmt)
  }

  // Migraciones ALTER TABLE para BDs existentes
  async function hasColumn(table: string, column: string): Promise<boolean> {
    const res = await client.execute({ sql: `PRAGMA table_info(${table})`, args: [] })
    return res.rows.some((r: any) => (r.name || rowToObj(r).name) === column)
  }

  if (!(await hasColumn('users', 'role_id'))) {
    await client.execute('ALTER TABLE users ADD COLUMN role_id INTEGER')
    await client.execute(`UPDATE users SET role_id = COALESCE((SELECT id FROM roles r WHERE r.name = users.role), 3)`)
  }
  if (!(await hasColumn('users', 'profile_image'))) {
    await client.execute('ALTER TABLE users ADD COLUMN profile_image TEXT')
  }
  for (const col of ['origin', 'harvest_date', 'expiration_date', 'certifications', 'unit']) {
    if (!(await hasColumn('products', col))) {
      await client.execute(`ALTER TABLE products ADD COLUMN ${col} TEXT`)
    }
  }
  if (!(await hasColumn('products', 'stock'))) {
    await client.execute('ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0')
  }
  if (!(await hasColumn('sales', 'quantity'))) {
    await client.execute('ALTER TABLE sales ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1')
  }
  if (!(await hasColumn('sales', 'seller_id'))) {
    await client.execute('ALTER TABLE sales ADD COLUMN seller_id INTEGER NOT NULL DEFAULT 0')
  }
  if (!(await hasColumn('sales', 'price_at_purchase'))) {
    await client.execute('ALTER TABLE sales ADD COLUMN price_at_purchase NUMERIC')
  }
  if (!(await hasColumn('sales', 'status'))) {
    await client.execute("ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'Pendiente'")
  }

  const count = await client.execute('SELECT COUNT(*) AS c FROM roles')
  const row = rowToObj(count.rows[0])
  if (Number(row.c) === 0) {
    for (const r of DEFAULT_ROLES) {
      await client.execute({ sql: 'INSERT INTO roles (name, description) VALUES (?, ?)', args: [r.name, r.description] })
    }
    for (const p of DEFAULT_PERMISSIONS) {
      await client.execute({ sql: 'INSERT INTO permissions (name, module) VALUES (?, ?)', args: [p.name, p.module] })
    }
    const adminRole = rowToObj((await client.execute("SELECT id FROM roles WHERE name = 'Administrador'")).rows[0]).id
    await client.execute('INSERT INTO role_permissions (role_id, permission_id) SELECT ?, id FROM permissions', [adminRole])
    const sellerRole = rowToObj((await client.execute("SELECT id FROM roles WHERE name = 'Vendedor'")).rows[0]).id
    await client.execute(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT ?, id FROM permissions
       WHERE name NOT LIKE 'users.%' AND name NOT LIKE 'roles.%' AND name != 'reports.view' AND name != 'classifications.view' AND name != 'settings.edit'`,
      [sellerRole]
    )
    const buyerRole = rowToObj((await client.execute("SELECT id FROM roles WHERE name = 'Comprador'")).rows[0]).id
    await client.execute(
      `INSERT INTO role_permissions (role_id, permission_id)
       SELECT ?, id FROM permissions
       WHERE name IN ('products.view', 'sales.view', 'settings.view')`,
      [buyerRole]
    )
    for (const c of ['Frutas', 'Verduras', 'Granos', 'Semillas', 'Herramientas']) {
      await client.execute({ sql: 'INSERT INTO category (name, description) VALUES (?, ?)', args: [c, null] })
    }
    for (const c of ['Nuevo', 'Como nuevo', 'Usado']) {
      await client.execute({ sql: 'INSERT INTO condition (name, description) VALUES (?, ?)', args: [c, null] })
    }
    for (const s of ['Disponible', 'Vendido', 'Reservado']) {
      await client.execute({ sql: 'INSERT INTO status (name, description) VALUES (?, ?)', args: [s, null] })
    }
  }
}

async function tursoQuery(sql: string, params: any[] = []): Promise<any[]> {
  const res = await (await getClient()).execute({ sql, args: params })
  return res.rows.map((r: any) => rowToObj(r))
}

function toNum(v: any): any {
  return typeof v === 'bigint' ? Number(v) : v
}

async function tursoRun(sql: string, params: any[] = []): Promise<any> {
  const res = await (await getClient()).execute({ sql, args: params })
  return { changes: toNum(res.rowsAffected) || 0, lastRowID: toNum(res.lastInsertRowid) ?? null }
}

async function tursoGetOne(sql: string, params: any[] = []): Promise<any | null> {
  const res = await (await getClient()).execute({ sql, args: params })
  return res.rows.length ? rowToObj(res.rows[0]) : null
}

// ---------------------------------------------------------------------------
// Modo local (sql.js, archivo en data/kopsale.db) — solo desarrollo
// ---------------------------------------------------------------------------

let SQL: any = null

async function getSQL() {
  if (!SQL) {
    const mod = await import(/* webpackIgnore: true */ 'sql.js/dist/sql-asm.js')
    const initSqlJs = mod.default || mod
    SQL = await initSqlJs()
  }
  return SQL
}

function tableExists(db: any, name: string) {
  const result = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name = ?", [name])
  return result && result.length > 0 && result[0].values.length > 0
}

function runSql(db: any, sql: string, params: any[] = []) {
  db.run(sql, params)
}

function ensureSchema(db: any) {
  db.run(SCHEMA)

  const cols = db.exec('PRAGMA table_info(users)')
  const hasRoleId = cols[0].values.some((v: any[]) => v[1] === 'role_id')
  if (!hasRoleId) {
    db.run('ALTER TABLE users ADD COLUMN role_id INTEGER')
    db.run(`
      UPDATE users
      SET role_id = COALESCE((SELECT id FROM roles r WHERE r.name = users.role), 3)
    `)
    try {
      db.run('ALTER TABLE users DROP COLUMN role')
    } catch (e) {
      // rol ya eliminado o no soportado, no es crítico
    }
  }
  const hasProfileImage = cols[0].values.some((v: any[]) => v[1] === 'profile_image')
  if (!hasProfileImage) {
    db.run('ALTER TABLE users ADD COLUMN profile_image TEXT')
  }

  const roleCount = db.exec('SELECT COUNT(*) FROM roles')
  if (!roleCount[0].values[0][0]) {
    for (const r of DEFAULT_ROLES) {
      runSql(db, 'INSERT INTO roles (name, description) VALUES (?, ?)', [r.name, r.description])
    }
    for (const p of DEFAULT_PERMISSIONS) {
      runSql(db, 'INSERT INTO permissions (name, module) VALUES (?, ?)', [p.name, p.module])
    }
    const adminRole = db.exec("SELECT id FROM roles WHERE name = 'Administrador'")[0].values[0][0]
    db.run('INSERT INTO role_permissions (role_id, permission_id) SELECT ?, id FROM permissions', [adminRole])
    const sellerRole = db.exec("SELECT id FROM roles WHERE name = 'Vendedor'")[0].values[0][0]
    db.run(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT ?, id FROM permissions
      WHERE name NOT LIKE 'users.%' AND name NOT LIKE 'roles.%' AND name != 'reports.view' AND name != 'classifications.view' AND name != 'settings.edit'
    `, [sellerRole])
    const buyerRole = db.exec("SELECT id FROM roles WHERE name = 'Comprador'")[0].values[0][0]
    db.run(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT ?, id FROM permissions
      WHERE name IN ('products.view', 'sales.view', 'settings.view')
    `, [buyerRole])
    const categoryCount = db.exec('SELECT COUNT(*) FROM category')
    if (!categoryCount[0].values[0][0]) {
      for (const c of ['Frutas', 'Verduras', 'Granos', 'Semillas', 'Herramientas']) {
        runSql(db, 'INSERT INTO category (name, description) VALUES (?, ?)', [c, null])
      }
      for (const c of ['Nuevo', 'Como nuevo', 'Usado']) {
        runSql(db, 'INSERT INTO condition (name, description) VALUES (?, ?)', [c, null])
      }
      for (const s of ['Disponible', 'Vendido', 'Reservado']) {
        runSql(db, 'INSERT INTO status (name, description) VALUES (?, ?)', [s, null])
      }
    }
  }
}

async function openDb() {
  const sql = await getSQL()
  if (!fs.existsSync(DB_PATH)) {
    const dir = path.dirname(DB_PATH)
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    const db = new sql.Database()
    ensureSchema(db)
    saveDb(db)
    return db
  }
  const data = fs.readFileSync(DB_PATH)
  const db = new sql.Database(data)
  tryInitSchema(db)
  return db
}

function tryInitSchema(db: any) {
  if (!tableExists(db, 'condition') || !tableExists(db, 'role_permissions')) {
    ensureSchema(db)
    saveDb(db)
  } else {
    let changed = false
    if (!tableExists(db, 'favorites') || !tableExists(db, 'calls')) {
      db.run(SCHEMA)
      changed = true
    }
    const cols = db.exec('PRAGMA table_info(users)')
    const hasRoleId = cols[0].values.some((v: any[]) => v[1] === 'role_id')
    if (!hasRoleId) {
      ensureSchema(db)
      saveDb(db)
      return
    }
    const pcols = db.exec('PRAGMA table_info(products)')
    if (pcols && pcols[0] && !pcols[0].values.some((v: any[]) => v[1] === 'stock')) {
      db.run('ALTER TABLE products ADD COLUMN stock INTEGER NOT NULL DEFAULT 0')
      changed = true
    }
    const scols = db.exec('PRAGMA table_info(sales)')
    if (scols && scols[0] && !scols[0].values.some((v: any[]) => v[1] === 'quantity')) {
      db.run('ALTER TABLE sales ADD COLUMN quantity INTEGER NOT NULL DEFAULT 1')
      changed = true
    }
    const pcols2 = db.exec('PRAGMA table_info(products)')
    const pcolNames = pcols2 && pcols2[0] ? pcols2[0].values.map((v: any[]) => v[1]) : []
    for (const col of ['origin', 'harvest_date', 'expiration_date', 'certifications', 'unit']) {
      if (!pcolNames.includes(col)) {
        db.run(`ALTER TABLE products ADD COLUMN ${col} TEXT`)
        changed = true
      }
    }
    const ucolNames = cols && cols[0] ? cols[0].values.map((v: any[]) => v[1]) : []
    if (!ucolNames.includes('profile_image')) {
      db.run('ALTER TABLE users ADD COLUMN profile_image TEXT')
      changed = true
    }
    const scols2 = db.exec('PRAGMA table_info(sales)')
    const scolNames = scols2 && scols2[0] ? scols2[0].values.map((v: any[]) => v[1]) : []
    if (!scolNames.includes('seller_id')) {
      db.run('ALTER TABLE sales ADD COLUMN seller_id INTEGER NOT NULL DEFAULT 0')
      changed = true
    }
    if (!scolNames.includes('price_at_purchase')) {
      db.run('ALTER TABLE sales ADD COLUMN price_at_purchase NUMERIC')
      changed = true
    }
    if (!scolNames.includes('status')) {
      db.run("ALTER TABLE sales ADD COLUMN status TEXT DEFAULT 'Pendiente'")
      changed = true
    }
    if (changed) saveDb(db)
  }
}

function saveDb(db: any) {
  const data = db.export()
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(DB_PATH, Buffer.from(data))
}

async function withDb<T>(fn: (db: any) => T): Promise<T> {
  const db = await openDb()
  try {
    const result = fn(db)
    saveDb(db)
    return result
  } finally {
    db.close()
  }
}

// ---------------------------------------------------------------------------
// API pública (misma interfaz en ambos modos)
// ---------------------------------------------------------------------------

export async function query(sql: string, params: any[] = []): Promise<any[]> {
  if (isTursoMode()) return tursoQuery(sql, params)
  assertDbReady()
  return withDb((db) => {
    const stmt = db.prepare(sql)
    if (params.length > 0) stmt.bind(params)
    const results: any[] = []
    while (stmt.step()) {
      results.push(stmt.getAsObject())
    }
    stmt.free()
    return results
  })
}

export async function run(sql: string, params: any[] = []): Promise<any> {
  if (isTursoMode()) return tursoRun(sql, params)
  assertDbReady()
  return withDb((db) => {
    const stmt = db.prepare(sql)
    if (params.length > 0) stmt.bind(params)
    stmt.step()
    const changes = db.getRowsModified()
    let lastRowID = null
    if (sql.trim().toUpperCase().startsWith('INSERT')) {
      const r = db.exec('SELECT last_insert_rowid()')
      if (r && r[0] && r[0].values && r[0].values[0]) lastRowID = r[0].values[0][0]
    }
    stmt.free()
    return { changes, lastRowID }
  })
}

export async function getOne(sql: string, params: any[] = []): Promise<any | null> {
  if (isTursoMode()) return tursoGetOne(sql, params)
  assertDbReady()
  return withDb((db) => {
    const stmt = db.prepare(sql)
    if (params.length > 0) stmt.bind(params)
    let result: any = null
    if (stmt.step()) {
      result = stmt.getAsObject()
    }
    stmt.free()
    return result ?? null
  })
}