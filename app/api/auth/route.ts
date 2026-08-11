// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { query, getOne } from '@/lib/db'

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET
  if (!secret) {
    throw new Error('JWT_SECRET no configurado en las variables de entorno')
  }
  return secret
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    const user = await getOne(
      'SELECT u.*, r.name AS role FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.email = ?',
      [email]
    )
    if (!user) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }
    const valid = await bcrypt.compare(password, user.password_hash)
    if (!valid) {
      return NextResponse.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }
    if (!user.is_active) {
      return NextResponse.json({ error: 'Usuario inactivo' }, { status: 401 })
    }
    const JWT_SECRET = getJwtSecret()
    const token = jwt.sign({ sub: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' })
    const { password_hash, first_name, last_name, ...rest } = user
    return NextResponse.json({
      token,
      user: { firstName: first_name, lastName: last_name, ...rest }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const token = authHeader.split(' ')[1]
    const decoded = jwt.verify(token, getJwtSecret()) as any
    const user = await getOne(
      'SELECT u.*, r.name AS role FROM users u LEFT JOIN roles r ON r.id = u.role_id WHERE u.id = ?',
      [decoded.sub]
    )
    if (!user || !user.is_active) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }
    const { password_hash, first_name, last_name, ...rest } = user
    return NextResponse.json({ user: { firstName: first_name, lastName: last_name, ...rest } })
  } catch (error: any) {
    if (error && error.message && String(error.message).includes('JWT_SECRET')) {
      return NextResponse.json({ error: 'JWT_SECRET no configurado en las variables de entorno' }, { status: 500 })
    }
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 })
  }
}