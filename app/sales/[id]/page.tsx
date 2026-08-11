'use client'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useApi, fmtDate } from '@/lib/apiClient'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function SaleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const api = useApi()
  const [sale, setSale] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const [all, prods, users, ratings] = await Promise.all([
          api.get('/api/sales').catch(() => []),
          api.get('/api/products').catch(() => []),
          api.get('/api/users').catch(() => []),
          api.get('/api/ratings').catch(() => []),
        ])
        const s: any = all.find((x: any) => x.id === Number(id))
        if (!s) { setNotFound(true); return }
        const prod: any = prods.find((p: any) => p.id === s.product_id)
        const buyer: any = users.find((u: any) => u.id === s.buyer_id)
        const rated = ratings.some((r: any) => r.sale_id === s.id)
        const qty = Number(s.quantity || 1)
        const price = prod ? Number(prod.price) : 0
        setSale({
          id: `V-${String(s.id).padStart(3, '0')}`,
          buyer: buyer ? `${buyer.first_name} ${buyer.last_name}` : '-',
          email: buyer?.email || '-',
          date: fmtDate(s.created_at),
          status: rated ? 'Completado' : 'Pendiente',
          subtotal: `$${(price * qty).toFixed(2)}`,
          shipping: '$0.00',
          total: `$${(price * qty).toFixed(2)}`,
          items: prod ? [{ name: prod.title, qty, price: `$${price.toFixed(2)}`, total: `$${(price * qty).toFixed(2)}` }] : [],
        })
      } catch { setNotFound(true) }
    })()
  }, [id])

  if (notFound) {
    return (
      <Layout>
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8B949E' }}>
          <i className="fas fa-receipt" style={{ fontSize: 30, display: 'block', marginBottom: 12, color: 'rgba(212,168,67,0.3)' }} />
          <p style={{ marginBottom: 14 }}>Venta no encontrada.</p>
          <Link href="/sales" className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000', textDecoration: 'none' }}>Volver a ventas</Link>
        </div>
      </Layout>
    )
  }

  if (!sale) {
    return <Layout><div style={{ padding: 40, textAlign: 'center', color: '#6a7580' }}>Cargando...</div></Layout>
  }

  return (
    <Layout>
      <div style={{
        background: 'var(--bg-card2)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <button onClick={() => router.back()} className="icon-btn" style={{ width: 28, height: 28, fontSize: 11 }}>
            <i className="fas fa-arrow-left" />
          </button>
          <h1 style={{ fontSize: 17, fontWeight: 700 }}>Venta {sale.id}</h1>
        </div>
        <p style={{ color: '#8B949E', fontSize: 12 }}>{sale.date}</p>
      </div>

      <div className="grid-2" style={{ gap: 14 }}>
        <div style={{ background: '#1e2a3a', borderRadius: 10, padding: 16, border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Información del Comprador</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Nombre', value: sale.buyer },
              { label: 'Email', value: sale.email },
              { label: 'Estado', value: sale.status },
            ].map(f => (
              <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0,0,0,0.15)', borderRadius: 6 }}>
                <span style={{ fontSize: 11, color: '#6a7580' }}>{f.label}</span>
                <span style={{ fontSize: 12, fontWeight: 500 }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: '#1e2a3a', borderRadius: 10, padding: 16, border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Resumen</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[
              { label: 'Subtotal', value: sale.subtotal },
              { label: 'Envío', value: sale.shipping },
              { label: 'Total', value: sale.total, highlight: true },
            ].map(f => (
              <div key={f.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 10px', background: f.highlight ? 'rgba(212,168,67,0.08)' : 'rgba(0,0,0,0.15)', borderRadius: 6
              }}>
                <span style={{ fontSize: 11, color: '#6a7580' }}>{f.label}</span>
                <span style={{ fontSize: 12, fontWeight: f.highlight ? 700 : 500, color: f.highlight ? '#D4A843' : '#fff', fontFamily: 'Inter' }}>{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', marginTop: 14 }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item: any, i: number) => (
                <tr key={i}>
                  <td style={{ fontSize: 12, fontWeight: 500 }}>{item.name}</td>
                  <td style={{ fontSize: 12, fontFamily: 'Inter' }}>{item.qty}</td>
                  <td style={{ fontSize: 12, color: '#8B949E', fontFamily: 'Inter' }}>{item.price}</td>
                  <td style={{ fontSize: 12, color: '#D4A843', fontWeight: 600, fontFamily: 'Inter' }}>{item.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}