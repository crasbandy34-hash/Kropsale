'use client'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useApi, localImg } from '@/lib/apiClient'
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
  const [qty, setQty] = useState(1)
  const [tab, setTab] = useState<'description' | 'details'>('description')
  const [buying, setBuying] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const role = user?.role

  useEffect(() => {
    ;(async () => {
      try {
        const id = Number(params.id)
        const [prods, cats, users, imgs] = await Promise.all([
          api.get('/api/products'),
          api.get('/api/categories').catch(() => []),
          api.get('/api/users').catch(() => []),
          api.get('/api/product-images').catch(() => []),
        ])
        const p: any = prods.find((x: any) => x.id === id)
        if (!p) { setNotFound(true); return }
        const cat = cats.find((c: any) => c.id === p.category_id)
        const seller = users.find((u: any) => u.id === p.seller_id)
        const img = imgs.find((i: any) => i.product_id === p.id && i.is_main) || imgs.find((i: any) => i.product_id === p.id)
        setProduct({
          id: p.id,
          sellerId: p.seller_id,
          name: p.title,
          category: cat ? cat.name : 'General',
          price: `$${Number(p.price).toFixed(2)}`,
          oldPrice: null,
          image: localImg(img ? img.image_url : ''),
          farmer: seller ? `${seller.firstName} ${seller.lastName}` : 'Vendedor',
          location: seller?.location || '-',
          rating: 0,
          reviews: 0,
          stock: Number(p.stock || 0),
          condition: p.condition_id === 1 ? 'Nuevo' : p.condition_id === 2 ? 'Como nuevo' : 'Usado',
          organic: false,
          description: p.description || 'Descripción no disponible.',
          origin: seller?.location || '-',
          harvest: '-',
          expiration: '-',
          certifications: [],
        })
        if (user?.id) {
          const favs = await api.get(`/api/favorites?user_id=${user.id}`).catch(() => [])
          setIsFav(favs.some((f: any) => f.product_id === p.id))
        }
      } catch { setNotFound(true) }
    })()
  }, [params.id])

  async function handleBuy() {
    if (!user) { router.push('/login'); return }
    setBuying(true)
    try {
      await api.post('/api/sales', { product_id: product.id, buyer_id: user.id, quantity: qty })
      alert('✓ Compra registrada. Puedes verla en "Ventas" y calificar al vendedor en "Valoraciones".')
      router.push('/sales')
    } catch (e: any) {
      alert(e.message || 'Error al comprar')
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

  async function handleContact() {
    if (!user) { router.push('/login'); return }
    try {
      const convos = await api.get('/api/conversations').catch(() => [])
      const existing = convos.find((c: any) => c.product_id === product.id && c.buyer_id === user.id)
      const id = existing ? existing.id : (await api.post('/api/conversations', {
        product_id: product.id, buyer_id: user.id, seller_id: product.sellerId,
      })).id
      router.push(`/conversations/${id}`)
    } catch (e: any) {
      alert(e.message || 'Error al abrir conversación')
    }
  }

  function BuyerActions() {
    return (
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" style={{ flex: 1, background: '#D4A843', color: '#000', padding: '10px', justifyContent: 'center', fontSize: 13 }} onClick={handleBuy} disabled={buying || product.stock === 0}>
          <i className="fas fa-cart-plus" /> {buying ? 'Comprando...' : product.stock === 0 ? 'Agotado' : 'Comprar'}
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
            {product.organic && <span style={{
              position: 'absolute', top: 10, left: 10, padding: '3px 12px', borderRadius: 10,
              background: '#8B7D6B', color: '#000', fontSize: 10, fontWeight: 600
            }}>Orgánico</span>}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            {[1].map(i => (
              <div key={i} style={{
                width: 60, height: 50, borderRadius: 6, overflow: 'hidden', cursor: 'pointer',
                border: '2px solid #D4A843'
              }}>
                <img src={product.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            ))}
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
            <span style={{ fontSize: 12, color: '#8B949E', fontFamily: 'Inter' }}>{product.rating} ({product.reviews})</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 24, fontWeight: 700, color: '#D4A843', fontFamily: 'Inter' }}>{product.price}</span>
            {product.oldPrice && <span style={{ fontSize: 13, color: '#6a7580', textDecoration: 'line-through', fontFamily: 'Inter' }}>{product.oldPrice}</span>}
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

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--border-color)', borderRadius: 6, overflow: 'hidden' }}>
              <button onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '6px 12px', background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: 13 }}>-</button>
              <span style={{ padding: '6px 14px', color: '#fff', fontSize: 13, fontWeight: 600, fontFamily: 'Inter' }}>{qty}</span>
              <button onClick={() => setQty(qty + 1)} style={{ padding: '6px 12px', background: 'none', border: 'none', color: '#8B949E', cursor: 'pointer', fontSize: 13 }}>+</button>
            </div>
            <span style={{ fontSize: 11, color: '#8B949E', fontFamily: 'Inter' }}>
              <i className="fas fa-box" style={{ marginRight: 4 }} />{product.stock} unidades disp.
            </span>
          </div>

          {role === 'Comprador' && <BuyerActions />}
          {role === 'Vendedor' && <SellerActions />}
          {role === 'Administrador' && <AdminActions />}
          {!role && <BuyerActions />}
        </div>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 4, borderBottom: '1px solid rgba(255,255,255,0.06)', marginBottom: 16, overflowX: 'auto' }}>
        {['description', 'details'].map(t => (
          <button key={t} onClick={() => setTab(t as any)} style={{
            padding: '8px 16px', background: 'none', border: 'none', cursor: 'pointer',
            color: tab === t ? '#D4A843' : '#8B949E', fontSize: 13, fontWeight: tab === t ? 600 : 400,
            borderBottom: tab === t ? '2px solid #D4A843' : '2px solid transparent', whiteSpace: 'nowrap'
          }}>
            {t === 'description' ? 'Descripción' : 'Detalles'}
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
              { label: 'Stock', value: `${product.stock} unidades` },
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
    </Layout>
  )
}