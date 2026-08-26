'use client'
import { useParams, useRouter } from 'next/navigation'
import Layout from '@/components/Layout'
import { useApi, fmtDate } from '@/lib/apiClient'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function SaleDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const api = useApi()
  const [sale, setSale] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)
  const [showRating, setShowRating] = useState(false)
  const [ratingScore, setRatingScore] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [ratingHover, setRatingHover] = useState(0)
  const [alreadyRated, setAlreadyRated] = useState(false)

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
        const seller: any = users.find((u: any) => u.id === (s.seller_id || prod?.seller_id))
        const rated = ratings.some((r: any) => r.sale_id === s.id)
        setAlreadyRated(rated)
        const qty = Number(s.quantity || 1)
        const price = s.price_at_purchase ? Number(s.price_at_purchase) : (prod ? Number(prod.price) : 0)
        setSale({
          id: `V-${String(s.id).padStart(3, '0')}`,
          numId: s.id,
          productId: s.product_id,
          productName: prod?.title || '-',
          buyer: buyer ? `${buyer.firstName} ${buyer.lastName}` : '-',
          email: buyer?.email || '-',
          sellerId: s.seller_id || prod?.seller_id,
          sellerName: seller ? `${seller.firstName} ${seller.lastName}` : '-',
          date: fmtDate(s.created_at),
          status: s.status || (rated ? 'Completado' : 'Pendiente'),
          subtotal: `$${(price * qty).toFixed(2)}`,
          shipping: '$0.00',
          total: `$${(price * qty).toFixed(2)}`,
          items: [{ name: prod?.title || '-', qty, price: `$${price.toFixed(2)}`, total: `$${(price * qty).toFixed(2)}` }],
        })
      } catch { setNotFound(true) }
    })()
  }, [id])

  async function submitRating() {
    if (!user?.id || !sale || ratingScore === 0) { alert('Selecciona una calificación'); return }
    try {
      await api.post('/api/ratings', {
        sale_id: sale.numId,
        reviewer_id: user.id,
        reviewee_id: sale.sellerId,
        score: ratingScore,
        comment: ratingComment || null,
      })
      setAlreadyRated(true)
      setShowRating(false)
      setSale({ ...sale, status: 'Completado' })
      alert('¡Calificación enviada!')
    } catch (e: any) {
      alert(e.message || 'Error al calificar')
    }
  }

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

      {user?.role === 'Comprador' && !alreadyRated && (
        <div style={{ marginTop: 14 }}>
          {!showRating ? (
            <button onClick={() => setShowRating(true)} style={{
              width: '100%', padding: '10px', background: 'rgba(212,168,67,0.1)', border: '1px solid rgba(212,168,67,0.2)',
              borderRadius: 8, color: '#D4A843', fontSize: 13, cursor: 'pointer', fontWeight: 600
            }}>
              <i className="fas fa-star" style={{ marginRight: 6 }} />Calificar al vendedor
            </button>
          ) : (
            <div style={{ background: '#1e2a3a', borderRadius: 10, padding: 16, border: '1px solid rgba(212,168,67,0.2)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Calificar a {sale.sellerName}</h3>
              <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} onClick={() => setRatingScore(i)}
                    onMouseEnter={() => setRatingHover(i)}
                    onMouseLeave={() => setRatingHover(0)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                    <i className="fas fa-star" style={{
                      fontSize: 24,
                      color: i <= (ratingHover || ratingScore) ? '#D4A843' : 'rgba(255,255,255,0.15)'
                    }} />
                  </button>
                ))}
              </div>
              <textarea placeholder="Comentario (opcional)" value={ratingComment} onChange={e => setRatingComment(e.target.value)}
                rows={3} style={{
                  width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                  borderRadius: 8, color: '#fff', fontSize: 13, resize: 'vertical', marginBottom: 12, boxSizing: 'border-box'
                }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setShowRating(false); setRatingScore(0); setRatingComment('') }} style={{
                  flex: 1, padding: '9px', background: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                  borderRadius: 8, color: '#8B949E', fontSize: 13, cursor: 'pointer'
                }}>Cancelar</button>
                <button onClick={submitRating} style={{
                  flex: 1, padding: '9px', background: '#D4A843', border: 'none',
                  borderRadius: 8, color: '#000', fontSize: 13, cursor: 'pointer', fontWeight: 600
                }}><i className="fas fa-star" style={{ marginRight: 4 }} />Enviar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {user?.role === 'Comprador' && alreadyRated && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 8, textAlign: 'center', color: '#4ade80', fontSize: 12 }}>
          <i className="fas fa-check-circle" style={{ marginRight: 4 }} />Ya calificaste esta venta
        </div>
      )}
    </Layout>
  )
}
