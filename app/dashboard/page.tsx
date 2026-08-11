'use client'
import { useAuth } from '@/context/AuthContext'
import { useApi, fmtDate } from '@/lib/apiClient'
import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'

interface RealStats {
  usersCount: number
  productsAll: any[]
  myProducts: any[]
  salesAll: any[]
  mySales: any[]
  myRatings: any[]
  roleCounts: { [role: string]: number }
  favCount: number
  monthlyAmounts: number[]
}

function useRealStats(): RealStats | null {
  const { user } = useAuth()
  const api = useApi()
  const [stats, setStats] = useState<RealStats | null>(null)

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const [users, products, sales, ratings, favs] = await Promise.all([
          api.get('/api/users').catch(() => []),
          api.get('/api/products').catch(() => []),
          api.get('/api/sales').catch(() => []),
          api.get('/api/ratings').catch(() => []),
          api.get(`/api/favorites?user_id=${user.id}`).catch(() => []),
        ])
        const price = (s: any) => {
          const p = products.find((x: any) => x.id === s.product_id)
          return p ? Number(p.price) : 0
        }
        const myProducts = user.role === 'Vendedor' ? products.filter((p: any) => p.seller_id === user.id) : []
        const roleCounts: { [role: string]: number } = {}
        users.forEach((u: any) => { roleCounts[u.role] = (roleCounts[u.role] || 0) + 1 })
        const months = Array(7).fill(0)
        sales.forEach((s: any) => {
          const m = new Date(s.created_at?.includes('T') ? s.created_at : String(s.created_at || '').replace(' ', 'T') + 'Z').getMonth()
          if (m >= 0 && m < 7) months[m] += price(s)
        })
        setStats({
          usersCount: users.length,
          productsAll: products,
          myProducts,
          salesAll: sales.map((s: any) => ({ ...s, _price: price(s) })),
          mySales: (user.role === 'Comprador'
            ? sales.filter((s: any) => s.buyer_id === user.id)
            : user.role === 'Vendedor'
              ? sales.filter((s: any) => products.some((p: any) => p.id === s.product_id && p.seller_id === user.id))
              : sales).map((s: any) => ({
            ...s,
            _price: price(s),
            _rated: ratings.some((r: any) => r.sale_id === s.id),
          })),
          myRatings: ratings.filter((r: any) => r.reviewer_id === user.id),
          favCount: favs.length,
          roleCounts,
          monthlyAmounts: months.map(v => Math.round(v)),
        })
      } catch { setStats(null) }
    })()
  }, [user?.id])

  return stats
}

function HeroBanner({ title, subtitle, cta1, cta2 }: { title: string; subtitle: string; cta1?: { label: string; onClick?: string }; cta2?: { label: string; onClick?: string } }) {
  return (
    <div style={{
      position: 'relative', borderRadius: 14, overflow: 'hidden',
      background: 'var(--bg-card-alt)', minHeight: 180
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(/images/farm-hero.svg)',
        backgroundSize: 'cover', backgroundPosition: 'center', opacity: 0.10
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(26,35,50,0.94)'
      }} />
      <div style={{ position: 'relative', padding: '24px 28px', zIndex: 1 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, color: '#E8E6E1' }}>{title}</h1>
        <p style={{ color: '#9CA3AF', fontSize: 13, marginBottom: 14, maxWidth: 420 }}>{subtitle}</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {cta1 && (
            <button className="btn btn-primary btn-sm" style={{ background: '#D4A843', color: '#1a2332' }} onClick={() => cta1.onClick && (window.location.href = cta1.onClick)}>
              <i className="fas fa-arrow-right" /> {cta1.label}
            </button>
          )}
          {cta2 && (
            <button className="btn btn-secondary btn-sm" style={{ borderColor: '#2D3748' }} onClick={() => cta2.onClick && (window.location.href = cta2.onClick)}>
              {cta2.label}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function AdminDashboard({ s }: { s: RealStats }) {
  const ventasMes = Math.round(s.salesAll.reduce((acc, x) => acc + (x._price || 0), 0))
  const stats = [
    { label: 'Usuarios', value: s.usersCount.toLocaleString(), icon: 'fa-users', change: 'registrados', color: '#4a5a6a' },
    { label: 'Productos', value: s.productsAll.length.toLocaleString(), icon: 'fa-boxes', change: 'publicados', color: '#D4A843' },
    { label: 'Ventas Mes', value: `$${ventasMes.toLocaleString()}`, icon: 'fa-dollar-sign', change: 'registradas', color: '#8B7D6B' },
    { label: 'Pedidos', value: s.salesAll.length.toLocaleString(), icon: 'fa-check-circle', change: 'en total', color: '#a78bfa' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <HeroBanner
        title="Panel de Administración"
        subtitle="Visión general de la plataforma Krop Sale."
        cta1={{ label: 'Gestionar Usuarios', onClick: '/users' }}
        cta2={{ label: 'Exportar Reportes', onClick: '/reports' }}
      />
      <div className="grid-4">
        {stats.map(st => (
          <div key={st.label} style={{ backgroundColor: '#1e2a3a', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#8B949E' }}>{st.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={'fas ' + st.icon} style={{ color: st.color, fontSize: 13 }} />
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2, fontFamily: 'Inter' }}>{st.value}</div>
            <div style={{ fontSize: 10, color: '#8B949E', fontFamily: 'Inter' }}>
              <i className="fas fa-arrow-up" style={{ color: '#8B7D6B', fontSize: 9 }} /> {st.change}
            </div>
          </div>
        ))}
      </div>
      <div className="grid-2">
        <div style={{ backgroundColor: '#1e2a3a', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Usuarios por Rol</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { role: 'Administrador', count: s.roleCounts['Administrador'] || 0, color: '#D4A843' },
              { role: 'Vendedor', count: s.roleCounts['Vendedor'] || 0, color: '#8B7D6B' },
              { role: 'Comprador', count: s.roleCounts['Comprador'] || 0, color: '#4a5a6a' },
            ].map(r => (
              <div key={r.role} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0,0,0,0.15)', borderRadius: 6 }}>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{r.role}</span>
                <span style={{ fontSize: 14, fontWeight: 700, color: r.color, fontFamily: 'Inter' }}>{r.count}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ backgroundColor: '#1e2a3a', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Ventas Mensuales</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 140, padding: '8px 0' }}>
            {[{ month: 'Ene', i: 0 }, { month: 'Feb', i: 1 }, { month: 'Mar', i: 2 }, { month: 'Abr', i: 3 }, { month: 'May', i: 4 }, { month: 'Jun', i: 5 }, { month: 'Jul', i: 6 }].map(m => {
              const amount = s.monthlyAmounts[m.i]
              const maxAmount = Math.max(...s.monthlyAmounts, 1)
              const height = (amount / maxAmount) * 100
              return (
                <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 9, color: '#6a7580', fontFamily: 'Inter' }}>${(amount / 1000).toFixed(1)}k</span>
                  <div style={{ width: '100%', height: height + '%', borderRadius: '4px 4px 0 0', background: 'var(--accent-amber)', minHeight: 2 }} />
                  <span style={{ fontSize: 10, color: '#8B949E' }}>{m.month}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function SellerDashboard({ s }: { s: RealStats }) {
  const myTotal = s.mySales.reduce((acc, x) => acc + (x._price || 0), 0)
  const salesAmount = Math.round(myTotal)
  const reviews = s.myRatings.length
  const stats = [
    { label: 'Mis Productos', value: String(s.myProducts.length), icon: 'fa-boxes-stacked', change: 'publicados', color: '#8B7D6B' },
    { label: 'Ventas', value: `$${salesAmount.toLocaleString()}`, icon: 'fa-receipt', change: 'registradas', color: '#D4A843' },
    { label: 'Pedidos', value: String(s.mySales.length), icon: 'fa-clock', change: 'en total', color: '#4a5a6a' },
    { label: 'Calificación', value: reviews ? String(reviews) : '0', icon: 'fa-star', change: reviews ? `${reviews} reseña(s)` : 'sin reseñas', color: '#D4A843' },
  ]
  const recentProducts = s.myProducts.slice(0, 3).map((p: any) => ({
    name: p.title,
    stock: Number(p.stock || 0),
    price: `$${Number(p.price).toFixed(2)}`,
    status: Number(p.stock || 0) > 0 ? 'Activo' : 'Sin Stock',
    statusColor: Number(p.stock || 0) > 0 ? '#8B7D6B' : '#8B4040',
  }))
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <HeroBanner
        title="Panel de Vendedor"
        subtitle="Gestiona tus productos y ventas."
        cta1={{ label: 'Agregar Producto', onClick: '/inventory' }}
        cta2={{ label: 'Ver Inventario', onClick: '/inventory' }}
      />
      <div className="grid-4">
        {stats.map(st => (
          <div key={st.label} style={{ backgroundColor: '#1e2a3a', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#8B949E' }}>{st.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={'fas ' + st.icon} style={{ color: st.color, fontSize: 13 }} />
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2, fontFamily: 'Inter' }}>{st.value}</div>
            <div style={{ fontSize: 10, color: '#8B949E', fontFamily: 'Inter' }}>
              <i className="fas fa-arrow-up" style={{ color: '#8B7D6B', fontSize: 9 }} /> {st.change}
            </div>
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: '#1e2a3a', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Productos Recientes</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Producto</th><th>Stock</th><th>Precio</th><th>Estado</th></tr></thead>
            <tbody>
              {recentProducts.length === 0 && (
                <tr><td colSpan={4} style={{ fontSize: 12, color: '#6a7580', textAlign: 'center', padding: 14 }}>Aún no tienes productos. Crea uno en Inventario.</td></tr>
              )}
              {recentProducts.map(p => (
                <tr key={p.name}>
                  <td style={{ fontWeight: 500, fontSize: 12 }}>{p.name}</td>
                  <td style={{ fontSize: 12, fontFamily: 'Inter' }}>{p.stock > 0 ? <span style={{ color: '#8B7D6B', fontFamily: 'Inter' }}>{p.stock}</span> : <span style={{ color: 'var(--accent-red)' }}>Agotado</span>}</td>
                  <td style={{ fontSize: 12, color: '#D4A843', fontWeight: 600, fontFamily: 'Inter' }}>{p.price}</td>
                  <td><span className="status-badge" style={{ fontSize: 9, background: p.statusColor + '20', color: p.statusColor, border: '1px solid ' + p.statusColor + '40' }}><span className="badge-dot" style={{ backgroundColor: p.statusColor }} />{p.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function BuyerDashboard({ s, products }: { s: RealStats, products: any[] }) {
  const total = Math.round(s.mySales.reduce((acc: number, x: any) => acc + (x._price || 0), 0))
  const stats = [
    { label: 'Pedidos', value: String(s.mySales.length), icon: 'fa-receipt', change: 'compras registradas', color: '#4a5a6a' },
    { label: 'Compras Total', value: `$${total.toLocaleString()}`, icon: 'fa-cart-shopping', change: 'en total', color: '#8B7D6B' },
    { label: 'Favoritos', value: String(s.favCount), icon: 'fa-heart', change: 'guardados', color: '#8B4040' },
    { label: 'Reseñas', value: String(s.myRatings.length), icon: 'fa-star', change: 'enviadas', color: '#D4A843' },
  ]
  const recentOrders = s.mySales.slice(0, 3).map((o: any) => {
    const prod: any = products.find((p: any) => p.id === o.product_id)
    return {
      id: `S-${String(o.id).padStart(3, '0')}`,
      num: o.id,
      product: prod ? prod.title : '-',
      amount: `$${Number(prod?.price || 0).toFixed(2)}`,
      status: o._rated ? 'Completado' : 'Pendiente',
      statusColor: o._rated ? '#8B7D6B' : '#4a5a6a',
      date: fmtDate(o.created_at),
    }
  })
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <HeroBanner
        title="Panel de Comprador"
        subtitle="Tus compras y pedidos agrícolas."
        cta1={{ label: 'Ver Catálogo', onClick: '/catalog' }}
        cta2={{ label: 'Mis Pedidos', onClick: '/sales' }}
      />
      <div className="grid-4">
        {stats.map(st => (
          <div key={st.label} style={{ backgroundColor: '#1e2a3a', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#8B949E' }}>{st.label}</span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className={'fas ' + st.icon} style={{ color: st.color, fontSize: 13 }} />
              </div>
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2, fontFamily: 'Inter' }}>{st.value}</div>
            {st.change && <div style={{ fontSize: 10, color: '#8B949E', fontFamily: 'Inter' }}>{st.change}</div>}
          </div>
        ))}
      </div>
      <div style={{ backgroundColor: '#1e2a3a', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border-color)' }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Pedidos Recientes</h3>
        <div className="table-wrap">
          <table>
            <thead><tr><th>ID</th><th>Producto</th><th>Monto</th><th>Estado</th><th>Fecha</th></tr></thead>
            <tbody>
              {recentOrders.length === 0 && (
                <tr><td colSpan={5} style={{ fontSize: 12, color: '#6a7580', textAlign: 'center', padding: 14 }}>Aún no haces compras. Explora el catálogo.</td></tr>
              )}
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: 600, fontSize: 12, color: '#D4A843', fontFamily: 'Inter' }}>{o.id}</td>
                  <td style={{ fontSize: 12 }}>{o.product}</td>
                  <td style={{ fontSize: 12, fontWeight: 600, fontFamily: 'Inter' }}>{o.amount}</td>
                  <td><span className="status-badge" style={{ fontSize: 9, background: o.statusColor + '20', color: o.statusColor, border: '1px solid ' + o.statusColor + '40' }}><span className="badge-dot" style={{ backgroundColor: o.statusColor }} />{o.status}</span></td>
                  <td style={{ fontSize: 11, color: '#6a7580' }}>{o.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const s = useRealStats()
  const role = user?.role
  if (!s) return <Layout><div style={{ padding: 40, textAlign: 'center', color: '#6a7580' }}>Cargando...</div></Layout>
  const dash = role === 'Administrador' ? <AdminDashboard s={s} /> : role === 'Vendedor' ? <SellerDashboard s={s} /> : <BuyerDashboard s={s} products={s.productsAll} />
  return <Layout>{dash}</Layout>
}