// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = parseInt(searchParams.get('user_id') || '0')
    if (!userId) return NextResponse.json({ error: 'user_id requerido' }, { status: 400 })
    const rows = await query(
      'SELECT f.user_id, f.product_id, f.created_at, p.title AS product_title, p.price FROM favorites f LEFT JOIN products p ON p.id = f.product_id WHERE f.user_id = ?',
      [userId]
    )
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener favoritos' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const userId = parseInt(data.user_id || data.userId || '0')
    const productId = parseInt(data.product_id || data.productId || '0')
    if (!userId || !productId) return NextResponse.json({ error: 'user_id y product_id son requeridos' }, { status: 400 })
    await run('INSERT OR IGNORE INTO favorites (user_id, product_id) VALUES (?, ?)', [userId, productId])
    return NextResponse.json({ success: true }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al agregar favorito' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = parseInt(searchParams.get('user_id') || '0')
    const productId = parseInt(searchParams.get('product_id') || '0')
    if (!userId || !productId) return NextResponse.json({ error: 'user_id y product_id son requeridos' }, { status: 400 })
    await run('DELETE FROM favorites WHERE user_id = ? AND product_id = ?', [userId, productId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar favorito' }, { status: 500 })
  }
}