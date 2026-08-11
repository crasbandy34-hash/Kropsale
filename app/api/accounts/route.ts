// @ts-nocheck
import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET() {
  try {
    const users = await query(
      'SELECT u.email, r.name AS role FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.is_active = 1'
    )
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener cuentas' }, { status: 500 })
  }
}
