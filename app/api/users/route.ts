// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { query, getOne, run } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const rows = await query(
      'SELECT u.id, u.first_name, u.last_name, u.email, u.location, r.name AS role, u.role_id, u.is_active, u.created_at FROM users u LEFT JOIN roles r ON r.id = u.role_id'
    )
    const users = rows.map((r: any) => ({ id: r.id, firstName: r.first_name, lastName: r.last_name, email: r.email, location: r.location, role: r.role, isActive: !!r.is_active, createdAt: r.created_at }))
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener usuarios' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const salt = await bcrypt.genSalt()
    const passwordHash = await bcrypt.hash(data.password, salt)
    const roleName = data.role || 'Comprador'
    const role = await getOne('SELECT id, name FROM roles WHERE name = ?', [roleName])
    if (!role) return NextResponse.json({ error: `Rol no encontrado: ${roleName}` }, { status: 400 })
    if (role.name === 'Administrador') {
      const existing = await getOne("SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'Administrador'")
      if (existing) return NextResponse.json({ error: 'Solo puede existir un Administrador' }, { status: 400 })
    }
    const result = await run(
      'INSERT INTO users (first_name, last_name, email, password_hash, role_id, location, is_active, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now"))',
      [data.firstName, data.lastName, data.email, passwordHash, role.id, data.location || null, data.isActive ?? true]
    )
    return NextResponse.json({ id: result.lastRowID }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al crear usuario' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    const data = await request.json()
    const updates: string[] = []
    const params: any[] = []
    if (data.firstName) { updates.push('first_name = ?'); params.push(data.firstName) }
    if (data.lastName) { updates.push('last_name = ?'); params.push(data.lastName) }
    if (data.email) { updates.push('email = ?'); params.push(data.email) }
    if (data.location !== undefined) { updates.push('location = ?'); params.push(data.location) }
    if (data.role !== undefined) {
      const role = await getOne('SELECT id, name FROM roles WHERE name = ?', [data.role])
      if (!role) return NextResponse.json({ error: `Rol no encontrado: ${data.role}` }, { status: 400 })
      if (role.name === 'Administrador') {
        const existing = await getOne("SELECT u.id FROM users u JOIN roles r ON r.id = u.role_id WHERE r.name = 'Administrador' AND u.id != ?", [id])
        if (existing) return NextResponse.json({ error: 'Solo puede existir un Administrador' }, { status: 400 })
      }
      updates.push('role_id = ?')
      params.push(role.id)
    }
    if (data.isActive !== undefined) { updates.push('is_active = ?'); params.push(data.isActive) }
    if (data.password) {
      const salt = await bcrypt.genSalt()
      const passwordHash = await bcrypt.hash(data.password, salt)
      updates.push('password_hash = ?')
      params.push(passwordHash)
    }
    if (updates.length === 0) return NextResponse.json({ error: 'No hay campos para actualizar' }, { status: 400 })
    params.push(id)
    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    await run('DELETE FROM users WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar' }, { status: 500 })
  }
}
