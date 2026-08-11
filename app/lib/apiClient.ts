'use client'
import { useAuth } from '@/context/AuthContext'

export function useApi() {
  const { token } = useAuth()
  const req = async (method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: any) => {
    const headers: any = { 'Content-Type': 'application/json' }
    if (token) headers['Authorization'] = `Bearer ${token}`
    const res = await fetch(url, { method, headers, body: body !== undefined ? JSON.stringify(body) : undefined })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error || 'Error de servidor')
    }
    return res.json()
  }
  return {
    get: (u: string) => req('GET', u),
    post: (u: string, b?: any) => req('POST', u, b),
    put: (u: string, b?: any) => req('PUT', u, b),
    del: (u: string) => req('DELETE', u),
  }
}

export const fallbackImg = '/images/placeholder-1.svg'

export function localImg(u?: string): string {
  if (!u) return fallbackImg
  if (u.startsWith('/')) return u
  if (u.startsWith('http://') || u.startsWith('https://')) return u
  return fallbackImg
}

export function fmtDate(s: string): string {
  if (!s) return ''
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return s
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function fmtTime(s: string): string {
  if (!s) return ''
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return s
  return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: true })
}

export function initials(name: string): string {
  return (name || '?').split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
}