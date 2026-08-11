// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const rows = await query(
      'SELECT rp.role_id, rp.permission_id, r.name AS role_name, p.name AS permission_name FROM role_permissions rp LEFT JOIN roles r ON r.id = rp.role_id LEFT JOIN permissions p ON p.id = rp.permission_id'
    )
    return NextResponse.json(rows)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener permisos de roles' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const roleId = parseInt(data.role_id || data.roleId || '0')
    const permissionId = parseInt(data.permission_id || data.permissionId || '0')
    if (!roleId || !permissionId) return NextResponse.json({ error: 'role_id y permission_id son requeridos' }, { status: 400 })
    await run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleId, permissionId])
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al asignar permiso' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = parseInt(searchParams.get('role_id') || '0')
    const permissionId = parseInt(searchParams.get('permission_id') || '0')
    const data = await request.json()
    const newRoleId = parseInt(data.role_id || data.roleId || String(roleId))
    const newPermissionId = parseInt(data.permission_id || data.permissionId || String(permissionId))
    if (!roleId || !permissionId || !newRoleId || !newPermissionId) {
      return NextResponse.json({ error: 'role_id y permission_id son requeridos' }, { status: 400 })
    }
    await run('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?', [roleId, permissionId])
    await run('INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [newRoleId, newPermissionId])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar permiso' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const roleId = parseInt(searchParams.get('role_id') || '0')
    const permissionId = parseInt(searchParams.get('permission_id') || '0')
    if (!roleId || !permissionId) return NextResponse.json({ error: 'role_id y permission_id son requeridos' }, { status: 400 })
    await run('DELETE FROM role_permissions WHERE role_id = ? AND permission_id = ?', [roleId, permissionId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar permiso' }, { status: 500 })
  }
}