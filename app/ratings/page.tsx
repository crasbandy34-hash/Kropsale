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

  useEffect(() => {
    if (!user?.id) return
    loadReviews()
  }, [user?.id])

  async function loadReviews() {
    try {
      const [all, sales, prods, users] = await Promise.all([
        api.get('/api/ratings').catch(() => []),
        api.get('/api/sales').catch(() => []),
        api.get('/api/products').catch(() => []),
        api.get('/api/users').catch(() => []),
      ])
      const received = all.filter((r: any) => r.reviewee_id === user?.id)
      setReviews(received.map((r: any) => {
        const sale: any = sales.find((s: any) => s.id === r.sale_id)
        const prod: any = prods.find((p: any) => p.id === sale?.product_id)
        const reviewer: any = users.find((u: any) => u.id === r.reviewer_id)
        return {
          id: r.id,
          product: prod ? prod.title : '-',
          reviewerName: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Comprador',
          rating: Number(r.score),
          comment: r.comment || '',
          date: fmtDate(r.created_at),
        }
      }))
    } catch { setReviews([]) }
    setLoaded(true)
  }

  const filtered = filter === 0 ? reviews : reviews.filter(r => r.rating === filter)
  const avg = reviews.length > 0 ? reviews.reduce((a, r) => a + r.rating, 0) / reviews.length : 0

  async function deleteReview(id: number) {
    if (!confirm('¿Eliminar esta reseña?')) return
    try {
      await api.del(`/api/ratings?id=${id}`)
      setReviews(prev => prev.filter(r => r.id !== id))
    } catch (e: any) {
      alert(e.message || 'Error al eliminar')
    }
  }

  function StarRating({ value }: { value: number }) {
    return (
      <div style={{ display: 'inline-flex', gap: 1 }}>
        {[1, 2, 3, 4, 5].map(s => (
          <i key={s} className={`fas fa-star`} style={{
            fontSize: 10, color: s <= value ? '#D4A843' : 'rgba(255,255,255,0.15)',
          }} />
        ))}
      </div>
    )
  }

  return (
    <Layout>
      <div style={{
        background: 'var(--bg-card2)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Reseñas Recibidas</h1>
            <p style={{ color: '#8B949E', fontSize: 12 }}>Reseñas que los compradores han dejado sobre ti.</p>
          </div>
          {reviews.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="fas fa-star" style={{ color: '#D4A843', fontSize: 16 }} />
              <span style={{ fontSize: 20, fontWeight: 700, color: '#D4A843', fontFamily: 'Inter' }}>{avg.toFixed(1)}</span>
              <span style={{ fontSize: 11, color: '#8B949E' }}>({reviews.length})</span>
            </div>
          )}
        </div>
      </div>

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
          Aún no has recibido reseñas.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {filtered.map(r => (
          <div key={r.id} style={{
            background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6, flexWrap: 'wrap', gap: 4 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{r.product}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  <StarRating value={r.rating} />
                  <span style={{ fontSize: 10, color: '#8B949E' }}>{r.rating}/5</span>
                  <span style={{ fontSize: 10, color: '#6a7580' }}>por {r.reviewerName}</span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: '#6a7580', whiteSpace: 'nowrap' }}>{r.date}</span>
                <button onClick={() => deleteReview(r.id)} style={{
                  background: 'none', border: 'none', color: '#6a7580', cursor: 'pointer', padding: 4, fontSize: 10, borderRadius: 4
                }} title="Eliminar reseña">
                  <i className="fas fa-trash" />
                </button>
              </div>
            </div>
            {r.comment && (
              <p style={{ fontSize: 12, color: '#d4d4d8', marginBottom: 6 }}>
                <i className="fas fa-quote-left" style={{ fontSize: 9, color: '#6a7580', marginRight: 4 }} />
                {r.comment}
              </p>
            )}
          </div>
        ))}
      </div>
    </Layout>
  )
}
