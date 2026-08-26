// @ts-nocheck
import { createCrudHandler } from '@/lib/crud'
import { run } from '@/lib/db'
import { requireAuth } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

const base = createCrudHandler({ table: 'conversations' })

export async function GET(request: NextRequest) {
  return base.GET(request)
}

export async function POST(request: NextRequest) {
  return base.POST(request)
}

export async function PUT(request: NextRequest) {
  return base.PUT(request)
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request)
  if (auth instanceof NextResponse) return auth
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    const { getOne } = await import('@/lib/db')
    const convo = await getOne('SELECT * FROM conversations WHERE id = ?', [id])
    if (!convo) return NextResponse.json({ error: 'Conversación no encontrada' }, { status: 404 })
    if (convo.buyer_id !== auth.user.id && convo.seller_id !== auth.user.id && auth.user.role !== 'Administrador') {
      return NextResponse.json({ error: 'No tienes permisos para eliminar esta conversación' }, { status: 403 })
    }
    await run('DELETE FROM messages WHERE conversation_id = ?', [id])
    await run('DELETE FROM calls WHERE conversation_id = ?', [id])
    await run('DELETE FROM conversations WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: 'Error al eliminar conversación' }, { status: 500 })
  }
}
