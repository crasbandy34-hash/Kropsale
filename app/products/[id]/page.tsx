'use client'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useApi, localImg, fmtDate } from '@/lib/apiClient'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const api = useApi()
  const [product, setProduct] = useState<any>(null)
  const [notFound, setNotFound] = useState(false)
  const [tab, setTab] = useState<'description' | 'details' | 'reviews'>('description')
  const [buying, setBuying] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [ratings, setRatings] = useState<any[]>([])
  const [sellerAvg, setSellerAvg] = useState(0)
  const [mySale, setMySale] = useState<any>(null)
  const [reviewStars, setReviewStars] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const role = user?.role

  useEffect(() => {
    ;(async () => {
      try {
        const id = Number(params.id)
        const [prods, cats, users, imgs, allRatings] = await Promise.all([
          api.get('/api/products'),
          api.get('/api/categories').catch(() => []),
          api.get('/api/users').catch(() => []),
          api.get('/api/product-images').catch(() => []),
          api.get('/api/ratings').catch(() => []),
        ])
        const p: any = prods.find((x: any) => x.id === id)
        if (!p) { setNotFound(true); return }
        const cat = cats.find((c: any) => c.id === p.category_id)
        const seller = users.find((u: any) => u.id === p.seller_id)
        const img = imgs.find((i: any) => i.product_id === p.id && i.is_main) || imgs.find((i: any) => i.product_id === p.id)
        const sellerRatings = allRatings.filter((r: any) => r.reviewee_id === p.seller_id)
        const avg = sellerRatings.length > 0 ? sellerRatings.reduce((acc: number, r: any) => acc + Number(r.score), 0) / sellerRatings.length : 0
        setSellerAvg(avg)
        setRatings(sellerRatings.map((r: any) => {
          const reviewer = users.find((u: any) => u.id === r.reviewer_id)
          return { ...r, reviewerName: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Comprador' }
        }))
        setProduct({
          id: p.id,
          sellerId: p.seller_id,
          name: p.title,
          category: cat ? cat.name : 'General',
          price: Number(p.price),
          image: localImg(img ? img.image_url : ''),
          farmer: seller ? `${seller.firstName} ${seller.lastName}` : 'Vendedor',
          location: seller?.location || '-',
          rating: avg,
          reviews: sellerRatings.length,
          stock: Number(p.stock || 0),
          condition: p.condition_id === 1 ? 'Nuevo' : p.condition_id === 2 ? 'Como nuevo' : 'Usado',
          description: p.description || 'Descripción no disponible.',
          origin: p.origin || seller?.location || '-',
          harvest: p.harvest_date || '-',
          expiration: p.expiration_date || '-',
          certifications: p.certifications ? p.certifications.split(',').map((c: string) => c.trim()).filter(Boolean) : [],
          unit: p.unit || 'Unidad',
        })
        if (user?.id) {
          const favs = await api.get(`/api/favorites?user_id=${user.id}`).catch(() => [])
          setIsFav(favs.some((f: any) => f.product_id === p.id))
          if (user.role === 'Comprador') {
            const sales = await api.get('/api/sales').catch(() => [])
            const myCompletedSale = sales.find((s: any) => s.buyer_id === user.id && s.seller_id === p.seller_id && s.status !== 'Cancelado')
            if (myCompletedSale) {
              setMySale(myCompletedSale)
              const alreadyReviewed = allRatings.some((r: any) => r.sale_id === myCompletedSale.id && r.reviewer_id === user.id)
              setReviewed(alreadyReviewed)
            }
          }
        }
      } catch { setNotFound(true) }
    })()
  }, [params.id])

  async function handleContact() {
    if (!user) { router.push('/login'); return }
    setBuying(true)
    try {
      const convos = await api.get('/api/conversations').catch(() => [])
      let existing = convos.find((c: any) => c.buyer_id === user.id && c.seller_id === product.sellerId)
      let convoId = existing?.id
      if (!convoId) {
        const res = await api.post('/api/conversations', {
          product_id: product.id, buyer_id: user.id, seller_id: product.sellerId,
        })
        convoId = res.id
      }
      await api.post('/api/messages', {
        conversation_id: convoId,
        sender_id: user.id,
        content: JSON.stringify({
          type: 'product_interest',
          product_id: product.id,
          product_name: product.name,
          product_price: product.price,
          product_image: product.image,
          product_unit: product.unit,
        }),
      })
      router.push(`/conversations/${convoId}`)
    } catch (e: any) {
      alert(e.message || 'Error al abrir conversación')
    }
    setBuying(false)
  }

  async function handleFavorite() {
    if (!user) { router.push('/login'); return }
    try {
      if (isFav) {
        await api.del(`/api/favorites?user_id=${user.id}&product_id=${product.id}`)
        setIsFav(false)
      } else {
        await api.post('/api/favorites', { user_id: user.id, product_id: product.id })
        setIsFav(true)
      }
    } catch (e: any) {
      alert(e.message || 'Error al actualizar favorito')
    }
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!user?.id || !mySale) return
    setReviewSaving(true)
    try {
      await api.post('/api/ratings', {
        sale_id: mySale.id,
        reviewer_id: user.id,
        reviewee_id: product.sellerId,
        score: reviewStars,
        comment: reviewComment,
      })
      setReviewed(true)
      setReviewComment('')
      setReviewStars(5)
      const allRatings = await api.get('/api/ratings').catch(() => [])
      const users = await api.get('/api/users').catch(() => [])
      const sellerRatings = allRatings.filter((r: any) => r.reviewee_id === product.sellerId)
      const avg = sellerRatings.length > 0 ? sellerRatings.reduce((acc: number, r: any) => acc + Number(r.score), 0) / sellerRatings.length : 0
      setSellerAvg(avg)
      setProduct({ ...product, rating: avg, reviews: sellerRatings.length })
      setRatings(sellerRatings.map((r: any) => {
        const reviewer = users.find((u: any) => u.id === r.reviewer_id)
        return { ...r, reviewerName: reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Comprador' }
      }))
    } catch (e: any) {
      alert(e.message || 'Error al enviar reseña')
    }
    setReviewSaving(false)
  }

  function BuyerActions() {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, background: '#D4A843', color: '#000', padding: '10px', justifyContent: 'center', fontSize: 13 }} onClick={handleContact} disabled={buying || product.stock === 0}>
          <i className="fas fa-comment" /> {buying ? 'Abriendo chat...' : product.stock === 0 ? 'Agotado' : 'Contactar al vendedor'}
        </button>
        <button className="btn btn-secondary" style={{ padding: '10px', borderColor: isFav ? 'rgba(212,168,67,0.4)' : 'var(--border-color)' }} onClick={handleFavorite}>
          <i className={`fas fa-heart`} style={{ color: isFav ? '#D4A843' : 'inherit' }} />
        </button>
      </div>
    )
  }

  function SellerActions() {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, background: '#D4A843', color: '#000', padding: '10px', justifyContent: 'center', fontSize: 13 }} onClick={() => router.push('/inventory')}>
          <i className="fas fa-edit" /> Editar Producto
        </button>
        <button className="btn btn-secondary" style={{ padding: '10px', color: 'var(--accent-red)', borderColor: 'var(--border-color)' }} onClick={() => router.push('/inventory')}>
          <i className="fas fa-trash" />
        </button>
      </div>
    )
  }

  function AdminActions() {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, background: '#D4A843', color: '#000', padding: '10px', justifyContent: 'center', fontSize: 13 }} onClick={() => router.push('/classifications')}>
          <i className="fas fa-cog" /> Gestionar
        </button>
        <Link href="/users" style={{ textDecoration: 'none' }}>
          <button className="btn btn-secondary" style={{ padding: '10px' }}>
            <i className="fas fa-users" /> Ver Usuarios
          </button>
        </Link>
      </div>
    )
  }

  if (notFound) {
    return (
      <Layout>
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8B949E' }}>
          <i className="fas fa-box-open" style={{ fontSize: 30, display: 'block', marginBottom: 12, color: 'rgba(212,168,67,0.3)' }} />
          <p style={{ marginBottom: 14 }}>Producto no encontrado.</p>
          <Link href="/catalog" className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000', textDecoration: 'none' }}>Volver al catálogo</Link>
        </div>
      </Layout>
    )
  }

  if (!product) {
    return <Layout><div style={{ padding: 40, textAlign: 'center', color: '#6a7580' }}>Cargando...</div></Layout>
  }

  return (
    <Layout>
      <div style={{ marginBottom: 12 }}>
        <Link href="/catalog" style={{ color: '#8B949E', fontSize: 12 }}>
          <i className="fas fa-arrow-left" style={{ marginRight: 4 }} />Volver
        </Link>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div>
          <div style={{
            borderRadius: 12, overflow: 'hidden', background: '#1e2a3a',
            border: '1px solid rgba(255,255,255,0.06)', position: 'relative'
          }}>
            <img src={product.image} alt={product.name} style={{ width: '100%', height: 240, objectFit: 'cover', display: 'block' }} className="prod-img" />
          </div>
        </div>

        <div>
          <span style={{ fontSize: 11, color: '#8B949E' }}>{product.category}</span>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, marginTop: 2 }}>{product.name}</h1>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map(i => (
                <i key={i} className="fas fa-star" style={{ color: i <= Math.floor(product.rating) ? '#D4A843' : 'rgba(255,255,255,0.15)', fontSize: 12 }} />
              ))}
            </div>
            <span style={{ fontSize: 12, color: '#8B949E', fontFamily: 'Inter' }}>{product.rating.toFixed(1)} ({product.reviews})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#D4A843', fontFamily: 'Inter' }}>${product.price.toFixed(2)}</span>
            <span style={{ fontSize: 11, color: '#8B949E' }}>por {product.unit}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, flexWrap: 'wrap' }}>
            <div
              onClick={handleContact}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, cursor: role === 'Comprador' ? 'pointer' : 'default',
                borderRadius: 8, padding: 2, transition: 'background .2s ease'
              }}
              onMouseOver={(e) => { if (role === 'Comprador') e.currentTarget.style.background = 'rgba(212,168,67,0.08)' }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-amber)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#000'
              }}>
                <i className="fas fa-user" />
              </div>
              <div style={{ fontSize: 13 }}>
                <span style={{ fontWeight: 600 }}>{product.farmer}</span>
                <span style={{ color: '#8B949E', fontSize: 11, marginLeft: 6 }}>{product.location}</span>
              </div>
              {role === 'Comprador' && <i className="fas fa-comment" style={{ color: '#D4A843', fontSize: 11 }} />}
            </div>
            {role === 'Comprador' && (
              <button onClick={handleContact} style={{
                marginLeft: 'auto', padding: '5px 12px', borderRadius: 6, background: 'rgba(212,168,67,0.08)',
                color: '#D4A843', border: '1px solid rgba(212,168,67,0.2)', fontSize: 11, textDecoration: 'none', cursor: 'pointer'
              }}>
                <i className="fas fa-comment" style={{ marginRight: 4 }} />Contactar
              </button>
            )}
            {role !== 'Comprador' && (
              <Link href="/conversations" style={{
                marginLeft: 'auto', padding: '5px 12px', borderRadius: 6, background: 'rgba(212,168,67,0.08)',
                color: '#D4A843', border: '1px solid rgba(212,168,67,0.2)', fontSize: 11, textDecoration: 'none'
              }}>
                <i className="fas fa-comment" style={{ marginRight: 4 }} />Contactar
              </Link>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{ fontSize: 11, color: '#8B949E', fontFamily: 'Inter' }}>
              <i className="fas fa-box" style={{ marginRight: 4 }} />{product.stock} {product.unit || 'unidades'} disp.
            </span>
          </div>

          {role === 'Comprador' && <BuyerActions />}
          {role === 'Vendedor' && <SellerActions />}
          {role === 'Administrador' && <AdminActions />}
          {!role && <BuyerActions />}
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, overflowX: 'auto' }}>
        {(['description', 'details', 'reviews'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t ? '#D4A843' : '#8B949E', fontSize: 13, fontWeight: tab === t ? 600 : 400,
            borderBottom: tab === t ? '2px solid #D4A843' : '2px solid transparent', whiteSpace: 'nowrap'
          }}>
            {t === 'description' ? 'Descripción' : t === 'details' ? 'Detalles' : `Reseñas (${product.reviews})`}
          </button>
        ))}
      </div>

      {tab === 'description' && (
        <div style={{ background: '#1e2a3a', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border-color)' }}>
          <p style={{ color: '#8B949E', fontSize: 13, lineHeight: 1.6 }}>{product.description}</p>
        </div>
      )}

      {tab === 'details' && (
        <div style={{ background: '#1e2a3a', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border-color)' }}>
          <div className="grid-2" style={{ gap: 10 }}>
            {[
              { label: 'Origen', value: product.origin },
              { label: 'Cosecha', value: product.harvest },
              { label: 'Vencimiento', value: product.expiration },
              { label: 'Condición', value: product.condition },
              { label: 'Unidad de venta', value: product.unit },
              { label: 'Stock', value: `${product.stock} ${product.unit || 'unidades'}` },
            ].map(d => (
              <div key={d.label} style={{ padding: '8px 12px', background: 'rgba(255,255,255,0.04)', borderRadius: 6, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: '#8B949E' }}>{d.label}</span>
                <span style={{ fontWeight: 500, fontFamily: 'Inter' }}>{d.value || '—'}</span>
              </div>
            ))}
          </div>
          {product.certifications.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Certificaciones</h4>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {product.certifications.map((c: string) => (
                  <span key={c} style={{ padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', color: 'var(--text-secondary)', fontSize: 11, border: '1px solid var(--border-color)' }}>
                    <i className="fas fa-certificate" style={{ marginRight: 4 }} />{c}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'reviews' && (
        <div style={{ background: '#1e2a3a', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#D4A843', fontFamily: 'Inter' }}>{product.rating.toFixed(1)}</div>
            <div>
              <div style={{ display: 'flex', gap: 2 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <i key={i} className="fas fa-star" style={{ color: i <= Math.round(product.rating) ? '#D4A843' : 'rgba(255,255,255,0.15)', fontSize: 12 }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#8B949E', marginTop: 2 }}>{product.reviews} reseña(s) del vendedor</div>
            </div>
          </div>

          {role === 'Comprador' && mySale && !reviewed && (
            <form onSubmit={submitReview} style={{ marginBottom: 18, padding: '14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(212,168,67,0.2)' }}>
              <h4 style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#D4A843' }}>
                <i className="fas fa-pen" style={{ marginRight: 6 }} />Califica a este vendedor
              </h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#8B949E' }}>Puntuación</span>
                <div style={{ display: 'inline-flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <i key={s} className="fas fa-star" style={{ fontSize: 14, color: s <= reviewStars ? '#D4A843' : 'rgba(255,255,255,0.15)', cursor: 'pointer' }} onClick={() => setReviewStars(s)} />
                  ))}
                </div>
              </div>
              <div style={{ marginBottom: 10 }}>
                <textarea value={reviewComment} onChange={e => setReviewComment(e.target.value)} rows={2} style={{
                  width: '100%', padding: '8px 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', borderRadius: 6, color: '#fff', fontSize: 12, resize: 'vertical'
                }} placeholder="¿Cómo fue tu experiencia? (opcional)" />
              </div>
              <button type="submit" disabled={reviewSaving} style={{
                padding: '7px 16px', borderRadius: 6, background: '#D4A843', color: '#000', border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer'
              }}>
                <i className="fas fa-paper-plane" style={{ marginRight: 4 }} />{reviewSaving ? 'Enviando...' : 'Enviar reseña'}
              </button>
            </form>
          )}
          {role === 'Comprador' && mySale && reviewed && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(139,125,107,0.12)', borderRadius: 8, border: '1px solid rgba(139,125,107,0.2)', fontSize: 12, color: '#8B7D6B' }}>
              <i className="fas fa-check-circle" style={{ marginRight: 6 }} />Ya calificaste a este vendedor.
            </div>
          )}
          {role === 'Comprador' && !mySale && (
            <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 12, color: '#6a7580' }}>
              <i className="fas fa-info-circle" style={{ marginRight: 6 }} />Solo puedes calificar vendedores de quienes hayas comprado.
            </div>
          )}
          {ratings.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#6a7580', fontSize: 12, padding: 20 }}>
              <i className="fas fa-star" style={{ fontSize: 20, display: 'block', marginBottom: 8, color: 'rgba(212,168,67,0.3)' }} />
              Este vendedor aún no tiene reseñas.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ratings.map((r: any) => (
                <div key={r.id} style={{ padding: '12px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--accent-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#000' }}>
                        {r.reviewerName?.[0] || '?'}
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600 }}>{r.reviewerName}</span>
                    </div>
                    <span style={{ fontSize: 10, color: '#6a7580' }}>{fmtDate(r.created_at)}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 4 }}>
                    {[1, 2, 3, 4, 5].map(i => (
                      <i key={i} className="fas fa-star" style={{ color: i <= Number(r.score) ? '#D4A843' : 'rgba(255,255,255,0.15)', fontSize: 10 }} />
                    ))}
                  </div>
                  {r.comment && <p style={{ fontSize: 12, color: '#8B949E', lineHeight: 1.5 }}>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
