// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { query, run } from '@/lib/db'

const ACTIVE = ["status IN ('ringing','ongoing')"]

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const conversationId = parseInt(searchParams.get('conversation_id') || '0')
    const calleeId = parseInt(searchParams.get('callee_id') || '0')
    const activeOnly = searchParams.get('active') === '1'
    const conds: string[] = []
    const params: any[] = []
    if (conversationId) { conds.push('conversation_id = ?'); params.push(conversationId) }
    if (calleeId) { conds.push('callee_id = ?'); params.push(calleeId) }
    if (activeOnly) conds.push(...ACTIVE)
    let sql = 'SELECT * FROM calls'
    if (conds.length) sql += ' WHERE ' + conds.join(' AND ')
    sql += ' ORDER BY id DESC'
    const rows = await query(sql, params)
    return NextResponse.json(rows)
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al obtener llamadas' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()
    const conversationId = parseInt(data.conversation_id || data.conversationId || '0')
    const callerId = parseInt(data.caller_id || data.callerId || '0')
    const calleeId = parseInt(data.callee_id || data.calleeId || '0')
    const type = data.type === 'video' ? 'video' : 'voice'
    if (!conversationId || !callerId || !calleeId) {
      return NextResponse.json({ error: 'conversation_id, caller_id y callee_id son requeridos' }, { status: 400 })
    }
    const active = await query('SELECT id FROM calls WHERE conversation_id = ? AND status IN (?, ?)', [conversationId, 'ringing', 'ongoing'])
    if (active.length > 0) {
      return NextResponse.json({ error: 'Ya hay una llamada activa en esta conversación' }, { status: 400 })
    }
    const result = await run(
      'INSERT INTO calls (conversation_id, caller_id, callee_id, type, status) VALUES (?, ?, ?, ?, ?)',
      [conversationId, callerId, calleeId, type, 'ringing']
    )
    return NextResponse.json({ id: result.lastRowID, status: 'ringing' }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al iniciar llamada' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    const data = await request.json()
    const status = String(data.status || '')
    if (!['ongoing', 'ended', 'declined'].includes(status)) {
      return NextResponse.json({ error: 'Estado no válido' }, { status: 400 })
    }
    const updates = ['status = ?']
    const params: any[] = [status]
    if (status === 'ongoing') { updates.push('answered_at = datetime("now")') }
    if (status === 'ended') { updates.push('ended_at = datetime("now")') }
    params.push(id)
    await run(`UPDATE calls SET ${updates.join(', ')} WHERE id = ?`, params)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Error al actualizar llamada' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id') || '0')
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    await run('DELETE FROM calls WHERE id = ?', [id])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar llamada' }, { status: 500 })
  }
}