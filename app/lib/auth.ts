// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { getOne } from '@/lib/db'

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET no configurado en las variables de entorno')
  }
  return secret
}

export function unauthorized(message = 'No autorizado'): NextResponse {
  return NextResponse.json({ error: message }, { status: 401 })
}

export function forbidden(message = 'No tienes permisos para esta acción'): NextResponse {
  return NextResponse.json({ error: message }, { status: 403 })
}

export async function requireAuth(request: NextRequest): Promise<{ user: any } | NextResponse> {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return unauthorized()
  }
  try {
    const decoded = jwt.verify(authHeader.slice(7), getJwtSecret()) as any
    const user = await getOne(
      'SELECT u.*, r.name AS role FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = ?',
      [decoded.sub]
    )
    if (!user || !user.is_active) {
      return unauthorized()
    }
    return { user }
  } catch (error) {
    return unauthorized()
  }
}

export function requireRole(user: any, roles: string[]): NextResponse | null {
  if (!user || !roles.includes(user.role)) {
    return forbidden()
  }
  return null
}