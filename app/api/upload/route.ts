// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireRole } from '@/lib/auth'

const ALLOWED = ['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']
const MAX_SIZE = 4.5 * 1024 * 1024

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req)
  if (auth instanceof NextResponse) return auth
  const denied = requireRole(auth.user, ['Administrador', 'Vendedor'])
  if (denied) return denied
  try {
    const form = await req.formData()
    const file = form.get('file')
    if (!file || typeof file === 'string') {
      return NextResponse.json({ error: 'Archivo requerido' }, { status: 400 })
    }
    const ext = (file.name || '').split('.').pop()?.toLowerCase()
    const dotExt = ext ? `.${ext}` : ''
    if (!ALLOWED.includes(dotExt) || !ext) {
      return NextResponse.json({ error: 'Formato no permitido (png, jpg, jpeg, webp, gif, svg)' }, { status: 400 })
    }
    const buf = Buffer.from(await file.arrayBuffer())
    if (buf.length === 0) return NextResponse.json({ error: 'Archivo vacío' }, { status: 400 })
    if (buf.length > MAX_SIZE) {
      return NextResponse.json({ error: 'El archivo supera el límite de 4.5 MB' }, { status: 413 })
    }
    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${dotExt}`

    if (process.env.BLOB_READ_WRITE_TOKEN) {
      const { put } = await import('@vercel/blob')
      const blob = await put(`uploads/${name}`, buf, { access: 'public', contentType: file.type || undefined })
      return NextResponse.json({ url: blob.url })
    }

    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN no configurado. En producción las imágenes deben subirse a Vercel Blob.' },
        { status: 500 }
      )
    }

    const fs = await import('fs')
    const path = await import('path')
    const dir = path.join(process.cwd(), 'public', 'uploads')
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, name), buf)
    return NextResponse.json({ url: `/uploads/${name}` })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Error al subir imagen' }, { status: 500 })
  }
}