'use client'
import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useApi, fmtTime, initials } from '@/lib/apiClient'

export default function ConversationsPage() {
  const { user } = useAuth()
  const api = useApi()
  const [conversations, setConversations] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const [all, msgs, users, roles, prods] = await Promise.all([
          api.get('/api/conversations').catch(() => []),
          api.get('/api/messages').catch(() => []),
          api.get('/api/users').catch(() => []),
          api.get('/api/roles').catch(() => []),
          api.get('/api/products').catch(() => []),
        ])
        const roleName = (id: number) => {
          const r = roles.find((x: any) => x.id === id)
          return r ? r.name.replace('a', '') : 'Usuario'
        }
        const mine = all.filter((c: any) => {
          if (user.role === 'Comprador') return c.buyer_id === user.id
          if (user.role === 'Vendedor') return c.seller_id === user.id
          return true
        })
        setConversations(mine.map((c: any) => {
          const otherId = user.role === 'Comprador' ? c.seller_id : user.role === 'Vendedor' ? c.buyer_id : (c.buyer_id === user.id ? c.seller_id : c.buyer_id)
          const other: any = users.find((u: any) => u.id === otherId)
          const convMsgs = msgs.filter((m: any) => m.conversation_id === c.id).sort((a: any, b: any) => (a.sent_at || '').localeCompare(b.sent_at || ''))
          const last = convMsgs[convMsgs.length - 1]
          const unread = convMsgs.filter((m: any) => m.sender_id !== user.id && !Number(m.is_read)).length
          const prod: any = prods.find((p: any) => p.id === c.product_id)
          const fullName = other ? `${other.first_name} ${other.last_name}` : 'Usuario'
          return {
            id: c.id,
            name: fullName,
            avatar: initials(fullName),
            lastMsg: last ? last.content : (prod ? `Interés en: ${prod.title}` : 'Sin mensajes todavía'),
            time: last ? fmtTime(last.sent_at) : 'Nuevo',
            unread,
            online: false,
            role: other ? roleName(other.role_id) : 'Usuario',
            subject: prod ? prod.title : '',
          }
        }))
      } catch { setConversations([]) }
      setLoaded(true)
    })()
  }, [user?.id])

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMsg.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout>
      <div style={{ background: 'var(--bg-card-alt)', borderRadius: 14, padding: '16px 18px', marginBottom: 14 }}>
        <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Conversaciones</h1>
        <p style={{ color: '#8B949E', fontSize: 12, marginBottom: 10 }}>Gestiona tus mensajes.</p>
        <div style={{ position: 'relative', maxWidth: '100%' }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6a7580', fontSize: 12 }} />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{
            width: '100%', padding: '8px 12px 8px 34px', backgroundColor: 'rgba(255,255,255,0.06)',
            border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 13
          }} />
        </div>
      </div>

      <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', overflow: 'hidden' }}>
        {loaded && filtered.length === 0 && (
          <div style={{ padding: 30, textAlign: 'center', color: '#6a7580', fontSize: 13 }}>
            <i className="fas fa-comments" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: 'rgba(212,168,67,0.3)' }} />
            Sin conversaciones. Contacta a un vendedor desde un producto.
          </div>
        )}
        {filtered.map((c, idx) => (
          <Link key={c.id} href={`/conversations/${c.id}`} style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
              borderBottom: idx < conversations.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              cursor: 'pointer', transition: 'background .2s ease'
            }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'none'}>
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%', background: 'var(--accent-amber)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000'
                }}>{c.avatar}</div>
                {c.online && <div style={{
                  position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                  borderRadius: '50%', background: '#8B7D6B', border: '2px solid #1e2a3a'
                }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</span>
                  <span style={{ fontSize: 10, color: '#6a7580', whiteSpace: 'nowrap' }}>{c.time}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: '#8B949E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }} className="convo-msg-maxw">{c.lastMsg}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.06)', color: '#8B949E' }}>{c.role}</span>
                    {c.unread > 0 && <span style={{
                      width: 18, height: 18, borderRadius: '50%', background: '#D4A843',
                      color: '#000', fontSize: 9, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter'
                    }}>{c.unread}</span>}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </Layout>
  )
}