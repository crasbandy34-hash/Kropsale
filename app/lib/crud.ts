// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { query, run, getOne } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth'

export interface CrudOptions {
  table: string
  idColumn?: string
  insertFields?: string[]
  updateFields?: string[]
  excludeFields?: string[]
  /** GET público (catálogo): no requiere token */
  publicRead?: boolean
  /** Roles permitidos para escribir. Vacío = cualquier usuario autenticado */
  writeRoles?: string[]
  /** Roles permitidos para GET (si publicRead es false). Vacío = cualquier autenticado */
  readRoles?: string[]
  /** Solo administrador */
  adminOnly?: boolean
}

export function createCrudHandler(opts: CrudOptions) {
  const table = opts.table
  const idColumn = opts.idColumn || 'id'

  function denyIfRoles(user: any, roles?: string[]): NextResponse | null {
    if (opts.adminOnly) return requireRole(user, ['Administrador'])
    if (roles && roles.length > 0) return requireRole(user, roles)
    return null
  }

  async function GET(request: NextRequest) {
    try {
      if (!opts.publicRead) {
        const auth = await requireAuth(request)
        if (auth instanceof NextResponse) return auth
        const denied = denyIfRoles(auth.user, opts.readRoles)
        if (denied) return denied
      }
      const rows = await query(`SELECT * FROM ${table}`)
      return NextResponse.json(rows)
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  async function POST(request: NextRequest) {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const denied = denyIfRoles(auth.user, opts.writeRoles)
    if (denied) return denied
    try {
      const data = await request.json()
      const fields = Object.keys(data).filter(k => !(opts.excludeFields || []).includes(k))
      const placeholders = fields.map(() => '?').join(', ')
      const values = fields.map(k => data[k])
      const result = await run(
        `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`,
        values
      )
      return NextResponse.json({ id: result.lastRowID }, { status: 201 })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  async function PUT(request: NextRequest) {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const denied = denyIfRoles(auth.user, opts.writeRoles)
    if (denied) return denied
    try {
      const { searchParams } = new URL(request.url)
      const id = parseInt(searchParams.get('id') || '0')
      if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
      const data = await request.json()
      const fields = Object.keys(data).filter(k => !(opts.excludeFields || []).includes(k))
      if (fields.length === 0) return NextResponse.json({ error: 'No hay campos' }, { status: 400 })
      const updates = fields.map(f => `${f} = ?`)
      const values = fields.map(k => data[k])
      values.push(id)
      await run(`UPDATE ${table} SET ${updates.join(', ')} WHERE ${idColumn} = ?`, values)
      return NextResponse.json({ success: true })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  async function DELETE(request: NextRequest) {
    const auth = await requireAuth(request)
    if (auth instanceof NextResponse) return auth
    const denied = denyIfRoles(auth.user, opts.writeRoles)
    if (denied) return denied
    try {
      const { searchParams } = new URL(request.url)
      const id = parseInt(searchParams.get('id') || '0')
      if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
      await run(`DELETE FROM ${table} WHERE ${idColumn} = ?`, [id])
      return NextResponse.json({ success: true })
    } catch (error: any) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  return { GET, POST, PUT, DELETE }
}