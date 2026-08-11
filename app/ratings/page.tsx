'use client'
import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useAuth } from '@/context/AuthContext'
import { useApi, fmtDate } from '@/lib/apiClient'

export default function RatingsPage() {
  const { user } = useAuth()
  const api = useApi()
  const [reviews, setReviews] = useState<any[]>([])
  const [filter, setFilter] = useState(0)
  const [loaded, setLoaded] = useState(false)

  const [rateSaleId, setRateSaleId] = useState<number>(0)
  const [rateStars, setRateStars] = useState(5)
  const [rateComment, setRateComment] = useState('')
  const [pendingSales, setPendingSales] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const [all, sales, prods, users] = await Promise.all([
          api.get('/api/ratings').catch(() => []),
          api.get('/api/sales').catch(() => []),
          api.get('/api/products').catch(() => []),
          api.get('/api/users').catch(() => []),
        ])
        setReviews(all.map((r: any) => {
          const sale: any = sales.find((s: any) => s.id === r.sale_id)
          const prod: any = prods.find((p: any) => p.id === sale?.product_id)
          const seller: any = users.find((u: any) => u.id === r.reviewee_id)
          const reviewer: any = users.find((u: any) => u.id === r.reviewer_id)
          return {
            id: r.id,
            product: prod ? prod.title : '-',
            seller: seller ? `${seller.firstName} ${seller.lastName}` : '-',
            rating: Number(r.score),
            comment: r.comment || '-',
            date: fmtDate(r.created_at),
            user: reviewer ? `${reviewer.firstName} ${reviewer.lastName.charAt(0)}.` : '-',
          }
        }))
        if (user.role === 'Comprador') {
          const mine = sales.filter((s: any) => s.buyer_id === user.id)
          const missing = mine.filter((s: any) => !all.some((r: any) => r.sale_id === s.id))
          setPendingSales(missing.map((s: any) => {
            const prod: any = prods.find((p: any) => p.id === s.product_id)
            const seller: any = users.find((u: any) => u.id === prod?.seller_id)
            return {
              id: s.id,
              title: prod ? prod.title : '-',
              sellerId: prod?.seller_id,
              seller: seller ? `${seller.firstName} ${seller.lastName}` : '-',
            }
          }))
          if (missing.length > 0) {
            const first = missing[0]
            const prod: any = prods.find((p: any) => p.id === first.product_id)
            setRateSaleId(first.id)
          }
        }
      } catch { setReviews([]) }
      setLoaded(true)
    })()
  }, [user?.id])

  const filtered = filter === 0 ? reviews : reviews.filter(r => r.rating === filter)

  function StarRating({ value, onPick }: { value: number, onPick?: (n: number) => void }) {
    return (
      <div style={{ display: 'inline-flex', gap: 1 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <i key={s} className={`fas fa-star`} style={{
            fontSize: 10, color: s <= value ? '#D4A843' : 'rgba(255,255,255,0.15)',
            cursor: onPick ? 'pointer' : 'default'
          }} onClick={onPick ? () => onPick(s) : undefined} />
        ))}
      </div>
    )
  }

  async function submitRating(e: React.FormEvent) {
    e.preventDefault()
    if (!rateSaleId || !user?.id) { alert('Selecciona una compra'); return }
    setSaving(true)
    try {
      await api.post('/api/ratings', {
        sale_id: rateSaleId, reviewer_id: user.id, reviewee_id: rateSaleId ? pendingSales.find(p => p.id === rateSaleId)?.sellerId ?? null : null,
        score: rateStars, comment: rateComment,
      })
      alert('✓ Valoración enviada. ¡Gracias!')
      setRateComment('')
      setPendingSales(pendingSales.filter(p => p.id !== rateSaleId))
      if (pendingSales.length > 1) setRateSaleId(pendingSales.filter(p => p.id !== rateSaleId)[0].id)
      else setRateSaleId(0)
      const all = await api.get('/api/ratings')
      const sales = await api.get('/api/sales')
      const prods = await api.get('/api/products')
      const users = await api.get('/api/users')
      setReviews(all.map((r: any) => {
        const sale: any = sales.find((s: any) => s.id === r.sale_id)
        const prod: any = prods.find((p: any) => p.id === sale?.product_id)
        const seller: any = users.find((u: any) => u.id === r.reviewee_id)
        const reviewer: any = users.find((u: any) => u.id === r.reviewer_id)
        return {
          id: r.id, product: prod ? prod.title : '-',
          seller: seller ? `${seller.firstName} ${seller.lastName}` : '-',
          rating: Number(r.score), comment: r.comment || '-',
          date: fmtDate(r.created_at),
          user: reviewer ? `${reviewer.firstName} ${reviewer.lastName.charAt(0)}.` : '-',
        }
      }))
    } catch (e: any) {
      alert(e.message || 'Error al enviar valoración')
    }
    setSaving(false)
  }

  return (
    <Layout>
      <div style={{
        background: 'var(--bg-card2)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14
      }}>
        <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Valoraciones</h1>
        <p style={{ color: '#8B949E', fontSize: 12 }}>Reseñas de productos.</p>
      </div>

      {user?.role === 'Comprador' && (
        <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 14, marginBottom: 14 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}><i className="fas fa-star" style={{ color: '#D4A843', marginRight: 6 }} />Calificar una compra</h3>
          {pendingSales.length === 0 ? (
            <p style={{ fontSize: 12, color: '#6a7580' }}>No tienes compras pendientes de valorar.</p>
          ) : (
            <form onSubmit={submitRating}>
              <div className="form-group">
                <label>Compra</label>
                <select value={rateSaleId} onChange={e => setRateSaleId(Number(e.target.value))} style={{
                  width: '100%', padding: '7px 10px', background: '#1e2a3a', border: '1px solid var(--border-color)', borderRadius: 6, color: '#fff', fontSize: 12
                }}>
                  {pendingSales.map(p => <option key={p.id} value={p.id}>{p.title} — {p.seller}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <label style={{ fontSize: 12, color: '#8B949E' }}>Puntuación</label>
                <StarRating value={rateStars} onPick={setRateStars} />
              </div>
              <div className="form-group">
                <label>Comentario (opcional)</label>
                <textarea value={rateComment} onChange={e => setRateComment(e.target.value)} rows={2} style={{
                  width: '100%', padding: '7px 10px', background: '#1e2a3a', border: '1px solid var(--border-color)', borderRadius: 6, color: '#fff', fontSize: 12, resize: 'vertical'
                }} placeholder="¿Cómo fue tu experiencia?" />
              </div>
              <button type="submit" disabled={saving} className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000', padding: '7px 16px' }}>
                <i className="fas fa-paper-plane" /> {saving ? 'Enviando...' : 'Enviar valoración'}
              </button>
            </form>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
        <button onClick={() => setFilter(0)} style={{
          padding: '4px 12px', borderRadius: 20, fontSize: 10, border: '1px solid var(--border-color)',
          background: filter === 0 ? '#D4A843' : 'transparent', color: filter === 0 ? '#000' : '#8B949E', cursor: 'pointer', fontWeight: filter === 0 ? 600 : 400
        }}>Todas</button>
        {[5, 4, 3, 2, 1].map(s => (
          <button key={s} onClick={() => setFilter(s)} style={{
            padding: '4px 10px', borderRadius: 20, fontSize: 10, border: '1px solid var(--border-color)',
            background: filter === s ? '#D4A843' : 'transparent', color: filter === s ? '#000' : '#8B949E', cursor: 'pointer',
            fontFamily: 'Inter'
          }}>
            {s} <i className="fas fa-star" style={{ fontSize: 8 }} />
          </button>
        ))}
      </div>

      {loaded && filtered.length === 0 && (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#6a7580', fontSize: 13, background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)' }}>
          <i className="fas fa-star-half-alt" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: 'rgba(212,168,67,0.3)' }} />
          Aún no hay valoraciones.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(r => (
          <div key={r.id} style={{
            background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.product}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <StarRating value={r.rating} />
                  <span style={{ fontSize: 10, color: '#8B949E' }}>por {r.user}</span>
                </div>
              </div>
              <span style={{ fontSize: 10, color: '#6a7580', whiteSpace: 'nowrap' }}>{r.date}</span>
            </div>
            <p style={{ fontSize: 12, color: '#d4d4d8', marginBottom: 6 }}>
              <i className="fas fa-quote-left" style={{ fontSize: 9, color: '#6a7580', marginRight: 4 }} />
              {r.comment}
            </p>
            <div style={{ fontSize: 10, color: '#6a7580' }}>
              <i className="fas fa-store" style={{ fontSize: 9, marginRight: 4 }} />
              Vendedor: {r.seller}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  )
}