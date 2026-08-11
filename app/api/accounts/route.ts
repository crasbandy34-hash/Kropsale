// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { requireAuth, requireRole } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth
  const denied = requireRole(auth.user, ['Administrador'])
  if (denied) return denied
  try {
    const users = await query(
      'SELECT u.email, r.name AS role FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.is_active = 1'
    )
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cuentas' }, { status: 500 })
  }
}