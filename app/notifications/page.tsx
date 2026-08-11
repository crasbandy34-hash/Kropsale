'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import { useApi } from '@/lib/apiClient'

function timeAgo(s: string): string {
  if (!s) return ''
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z')
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'Ahora'
  if (min < 60) return `Hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `Hace ${h} hora${h > 1 ? 's' : ''}`
  const days = Math.floor(h / 24)
  if (days < 7) return `Hace ${days} día${days > 1 ? 's' : ''}`
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })
}

function tsOf(s: string): number {
  if (!s) return 0
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z')
  return isNaN(d.getTime()) ? 0 : d.getTime()
}

export default function NotificationsPage() {
  const { user } = useAuth()
  const api = useApi()
  const [filter, setFilter] = useState('all')
  const [notifications, setNotifications] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const [users, products, sales, ratings, messages, conversations] = await Promise.all([
          api.get('/api/users').catch(() => []),
          api.get('/api/products').catch(() => []),
          api.get('/api/sales').catch(() => []),
          api.get('/api/ratings').catch(() => []),
          api.get('/api/messages').catch(() => []),
          api.get('/api/conversations').catch(() => []),
        ])
        const role = user.role
        const items: any[] = []

        const mySales = role === 'Comprador'
          ? sales.filter((s: any) => s.buyer_id === user.id)
          : role === 'Vendedor'
            ? sales.filter((s: any) => products.some((p: any) => p.id === s.product_id && p.seller_id === user.id))
            : sales

        for (const s of mySales.slice(-4).reverse()) {
          const p: any = products.find((x: any) => x.id === s.product_id)
          const buyers = users.find((u: any) => u.id === s.buyer_id)
          items.push(role === 'Comprador' ? {
            id: `sale-${s.id}`, icon: 'fa-receipt', color: '#4a5a6a',
            title: 'Compra registrada',
            desc: `Compraste ${s.quantity || 1} x ${p ? p.title : 'producto'} por $${p ? (Number(p.price) * Number(s.quantity || 1)).toFixed(2) : '0.00'}.`,
            time: timeAgo(s.created_at), ts: tsOf(s.created_at), read: true, href: `/sales/${s.id}`,
          } : {
            id: `sale-${s.id}`, icon: 'fa-store', color: '#8B7D6B',
            title: 'Nueva venta',
            desc: `${buyers ? `${buyers.first_name} ${buyers.last_name}` : 'Un comprador'} compró ${s.quantity || 1} x ${p ? p.title : 'tu producto'}.`,
            time: timeAgo(s.created_at), ts: tsOf(s.created_at), read: true, href: `/sales/${s.id}`,
          })
        }

        const convosForMe = conversations.filter((c: any) => c.buyer_id === user.id || c.seller_id === user.id || role === 'Administrador')
        const unreadCnt = messages.filter((m: any) =>
          convosForMe.some((c: any) => c.id === m.conversation_id) && m.sender_id !== user.id && !Number(m.is_read)
        ).length
        items.push({
          id: 'unread', icon: 'fa-comment', color: '#4a5a6a',
          title: 'Mensajes sin leer',
          desc: unreadCnt > 0 ? `Tienes ${unreadCnt} mensaje(s) sin leer.` : 'No tienes mensajes sin leer.',
            time: '', read: unreadCnt === 0, href: '/conversations',
        })

        const myRatings = role === 'Comprador'
          ? ratings.filter((r: any) => r.reviewer_id === user.id)
          : role === 'Vendedor'
            ? ratings.filter((r: any) => r.reviewee_id === user.id)
            : ratings
        for (const r of myRatings.slice(-3).reverse()) {
          const sale: any = sales.find((x: any) => x.id === r.sale_id)
          const p: any = products.find((x: any) => x.id === sale?.product_id)
          items.push(role === 'Comprador' ? {
            id: `rate-${r.id}`, icon: 'fa-star', color: '#D4A843',
            title: 'Valoración enviada',
            desc: `Calificaste ${r.score}/5${r.comment ? `: "${r.comment}"` : ''} por ${p ? p.title : 'tu compra'}.`,
            time: timeAgo(r.created_at), ts: tsOf(r.created_at), read: true, href: '/ratings',
          } : {
            id: `rate-${r.id}`, icon: 'fa-star', color: '#D4A843',
            title: 'Nueva reseña',
            desc: `Tu producto ${p ? p.title : ''} recibió ${r.score}/5 estrellas.`,
            time: timeAgo(r.created_at), ts: tsOf(r.created_at), read: true, href: '/ratings',
          })
        }

        if (role === 'Administrador') {
          for (const u of users.slice(-3).reverse()) {
            items.push({
              id: `user-${u.id}`, icon: 'fa-user-plus', color: '#8B7D6B',
              title: 'Nuevo usuario',
              desc: `${u.firstName} ${u.lastName} se registró como ${u.role}.`,
              time: timeAgo(u.createdAt), ts: tsOf(u.createdAt), read: true, href: '/users',
            })
          }
        }

        items.sort((a, b) => (b.ts || 0) - (a.ts || 0))
        setNotifications(items)
      } catch { setNotifications([]) }
      setLoaded(true)
    })()
  }, [user?.id])

  async function markAllRead() {
    if (user?.id) {
      try {
        const msgs = await api.get('/api/messages').catch(() => [])
        for (const m of msgs) {
          if (m.sender_id !== user.id && !Number(m.is_read)) {
            await api.put(`/api/messages?id=${m.id}`, { is_read: 1 }).catch(() => {})
          }
        }
      } catch { }
    }
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  function toggle(n: any) {
    if (n.href) window.location.href = n.href
  }

  const filtered = filter === 'all' ? notifications : filter === 'unread' ? notifications.filter(n => !n.read) : notifications
  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <Layout>
      <div style={{
        background: 'var(--bg-card-alt)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
          <h1 style={{ fontSize: 19, fontWeight: 700 }}>Notificaciones</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {unreadCount > 0 && (
              <span style={{
                padding: '2px 8px', borderRadius: 10, fontSize: 10, fontWeight: 600,
                background: 'rgba(212,168,67,0.12)', color: '#D4A843', fontFamily: 'Inter'
              }}>{unreadCount} sin leer</span>
            )}
            {unreadCount > 0 && (
              <button onClick={markAllRead} style={{
                padding: '4px 10px', borderRadius: 10, fontSize: 10, fontWeight: 600, cursor: 'pointer',
                background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.2)'
              }}>
                <i className="fas fa-check-double" style={{ marginRight: 4 }} />Marcar todo leído
              </button>
            )}
          </div>
        </div>
        <p style={{ color: '#8B949E', fontSize: 12 }}>Actividad real de tu cuenta.</p>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[['all', 'Todas'], ['unread', 'Sin leer']].map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 10, border: '1px solid var(--border-color)',
            background: filter === k ? '#D4A843' : 'transparent', color: filter === k ? '#000' : '#8B949E', cursor: 'pointer', fontWeight: filter === k ? 600 : 400
          }}>{label}</button>
        ))}
      </div>

      {loaded && filtered.length === 0 && (
        <div style={{ padding: 30, textAlign: 'center', color: '#6a7580', fontSize: 13 }}>
          <i className="fas fa-bell-slash" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: 'rgba(212,168,67,0.3)' }} />
          No hay notificaciones.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map(n => (
          <div key={n.id} onClick={() => toggle(n)} style={{
            display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px',
            background: !n.read ? 'rgba(212,168,67,0.06)' : 'rgba(255,255,255,0.02)',
            border: '1px solid ' + (n.read ? 'var(--border-color)' : 'rgba(212,168,67,0.15)'),
            borderRadius: 10, cursor: n.href ? 'pointer' : 'default'
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.05)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <i className={`fas ${n.icon}`} style={{ color: n.color, fontSize: 14 }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: n.read ? 500 : 700 }}>{n.title}</span>
                {n.time && <span style={{ fontSize: 10, color: '#6a7580', whiteSpace: 'nowrap' }}>{n.time}</span>}
              </div>
              <p style={{ fontSize: 12, color: '#8B949E', marginTop: 2, lineHeight: 1.5 }}>{n.desc}</p>
            </div>
            {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#D4A843', marginTop: 4, flexShrink: 0 }} />}
          </div>
        ))}
      </div>
    </Layout>
  )
}