'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useApi, fmtDate } from '@/lib/apiClient'
import Layout from '@/components/Layout'

export default function SalesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const api = useApi()
  const [sales, setSales] = useState<any[]>([])
  const [filter, setFilter] = useState('all')
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const [all, prods, users, ratings] = await Promise.all([
          api.get('/api/sales').catch(() => []),
          api.get('/api/products').catch(() => []),
          api.get('/api/users').catch(() => []),
          api.get('/api/ratings').catch(() => []),
        ])
        const role = user.role
        const mine = all.filter((s: any) => {
          const prod: any = prods.find((p: any) => p.id === s.product_id)
          if (role === 'Comprador') return s.buyer_id === user.id
          if (role === 'Vendedor') return prod && prod.seller_id === user.id
          return true
        })
        setSales(mine.map((s: any) => {
          const prod: any = prods.find((p: any) => p.id === s.product_id)
          const buyer: any = users.find((u: any) => u.id === s.buyer_id)
          const rated = ratings.some((r: any) => r.sale_id === s.id)
          const qty = Number(s.quantity || 1)
          const total = prod ? Number(prod.price) * qty : 0
          return {
            id: `V-${String(s.id).padStart(3, '0')}`,
            num: s.id,
            buyer: buyer ? `${buyer.first_name} ${buyer.last_name}` : '-',
            items: qty,
            total: `$${total.toFixed(2)}`,
            status: rated ? 'Completado' : 'Pendiente',
            date: fmtDate(s.created_at),
            viewable: true,
          }
        }))
      } catch { setSales([]) }
      setLoaded(true)
    })()
  }, [user?.id])

  const filtered = filter === 'all' ? sales : sales.filter(s => {
    if (filter === 'pending') return s.status === 'Pendiente'
    if (filter === 'shipping') return s.status === 'Envío'
    if (filter === 'completed') return s.status === 'Completado'
    if (filter === 'cancelled') return s.status === 'Cancelado'
    return true
  })

  const totalAmount = sales.reduce((acc, s) => acc + parseFloat(s.total.replace('$', '') || '0'), 0)
  const salesStats = [
    { label: 'Total Ventas', value: `$${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, color: '#D4A843' },
    { label: 'Completadas', value: String(sales.filter(s => s.status === 'Completado').length), color: '#8B7D6B' },
    { label: 'Pendientes', value: String(sales.filter(s => s.status === 'Pendiente').length), color: '#4a5a6a' },
    { label: 'Canceladas', value: String(sales.filter(s => s.status === 'Cancelado').length), color: '#8B4040' },
  ]

  return (
    <Layout>
      <div style={{
        background: 'var(--bg-card-alt)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14
      }}>
        <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Ventas</h1>
        <p style={{ color: '#8B949E', fontSize: 12 }}>Registro de ventas realizadas.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10, marginBottom: 16 }}>
        {salesStats.map(s => (
          <div key={s.label} style={{ background: '#1e2a3a', borderRadius: 10, padding: '10px 12px', border: '1px solid var(--border-color)', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: s.color, fontFamily: 'Inter' }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#8B949E', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        {[{ key: 'all', label: 'Todas' }, { key: 'pending', label: 'Pendiente' }, { key: 'shipping', label: 'Envío' }, { key: 'completed', label: 'Completado' }, { key: 'cancelled', label: 'Cancelado' }].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 10, border: '1px solid var(--border-color)',
            background: filter === f.key ? '#D4A843' : 'transparent', color: filter === f.key ? '#000' : '#8B949E', cursor: 'pointer', fontWeight: filter === f.key ? 600 : 400
          }}>{f.label}</button>
        ))}
      </div>

      {loaded && filtered.length === 0 && (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#6a7580', fontSize: 13, background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)' }}>
          <i className="fas fa-receipt" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: 'rgba(212,168,67,0.3)' }} />
          No hay ventas {filter !== 'all' ? 'con ese estado' : 'todavía'}.
        </div>
      )}

      <div className="table-wrap" style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)' }}>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th className="hide-mob">Comprador</th>
              <th>Items</th>
              <th>Total</th>
              <th className="hide-mob">Estado</th>
              <th>Fecha</th>
              <th style={{ textAlign: 'center' }}>Ver</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(s => {
              const statusColors: Record<string, string> = {
                'Completado': '#8B7D6B', 'Pendiente': '#4a5a6a', 'Envío': '#D4A843', 'Cancelado': '#8B4040'
              }
              return (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600, fontSize: 12, fontFamily: 'Inter' }}>{s.id}</td>
                  <td className="hide-mob" style={{ fontSize: 12, color: '#8B949E' }}>{s.buyer}</td>
                  <td style={{ fontSize: 12, fontFamily: 'Inter' }}>{s.items}</td>
                  <td style={{ fontSize: 12, color: '#D4A843', fontWeight: 600, fontFamily: 'Inter' }}>{s.total}</td>
                  <td className="hide-mob">
                    <span className="status-badge" style={{ fontSize: 9, background: `${statusColors[s.status]}20`, color: statusColors[s.status] }}>
                      <span className="badge-dot" style={{ background: statusColors[s.status] }} />
                      {s.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, color: '#6a7580' }}>{s.date}</td>
                  <td style={{ textAlign: 'center' }}>
                    {s.viewable ? (
                      <button onClick={() => router.push(`/sales/${s.num}`)} className="icon-btn" style={{ width: 28, height: 28, fontSize: 10 }}>
                        <i className="fas fa-arrow-right" />
                      </button>
                    ) : <span style={{ fontSize: 10, color: '#64748b' }}>-</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Layout>
  )
}