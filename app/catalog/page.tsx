'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useApi, localImg } from '@/lib/apiClient'
import Layout from '@/components/Layout'
import Link from 'next/link'

function ProductCard({ p, onDelete }: { p: any; onDelete: (id: number) => void }) {
  const { user } = useAuth()
  return (
    <Link key={p.id} href={`/products/${p.id}`} style={{ textDecoration: 'none' }}>
      <div style={{
        backgroundColor: '#1e2a3a', borderRadius: 12, overflow: 'hidden',
        border: '1px solid var(--border-color)', transition: 'all .3s ease', cursor: 'pointer', height: '100%'
      }}
        onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.3)' }}
        onMouseOut={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}>
        <div style={{ position: 'relative', height: 130, background: '#1e2a3a', overflow: 'hidden' }}>
          <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {p.organic && <span style={{ position: 'absolute', top: 8, left: 8, padding: '2px 8px', borderRadius: 10, background: 'rgba(74,222,128,0.9)', color: '#000', fontSize: 9, fontWeight: 600 }}>Orgánico</span>}
          {p.stock === 0 && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ background: 'var(--accent-red)', color: '#fff', padding: '3px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600 }}>Agotado</span>
          </div>}
        </div>
        <div style={{ padding: '10px 12px' }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 2, color: '#fff' }}>{p.name}</h3>
          <p style={{ fontSize: 10, color: '#8B949E', marginBottom: 6 }}>{p.farmer}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#D4A843', fontFamily: 'Inter' }}>{p.price}</span>
            {p.oldPrice && <span style={{ fontSize: 11, color: '#6a7580', textDecoration: 'line-through', fontFamily: 'Inter' }}>{p.oldPrice}</span>}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#8B949E' }}>
            <i className="fas fa-star" style={{ color: '#D4A843' }} />
            <span style={{ fontFamily: 'Inter', fontWeight: 400 }}>{p.rating}</span>
            <span style={{ fontFamily: 'Inter', fontWeight: 400 }}>({p.reviews})</span>
          </div>
          {user?.role === 'Comprador' && p.stock > 0 && (
            <div style={{ marginTop: 8 }}>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `/products/${p.id}` }} style={{ width: '100%', padding: '6px', background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 6, color: '#D4A843', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                <i className="fas fa-cart-plus" style={{ marginRight: 4 }} />Agregar
              </button>
            </div>
          )}
          {user?.role === 'Vendedor' && (
            <div style={{ marginTop: 8, display: 'flex', gap: 4 }}>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = '/inventory' }} style={{ flex: 1, padding: '6px', background: 'rgba(212,168,67,0.12)', border: '1px solid rgba(212,168,67,0.2)', borderRadius: 6, color: '#D4A843', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                <i className="fas fa-edit" /> Editar
              </button>
              <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(p.id) }} style={{ flex: 1, padding: '6px', background: 'rgba(139,64,64,0.12)', border: '1px solid rgba(139,64,64,0.2)', borderRadius: 6, color: 'var(--accent-red)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                <i className="fas fa-trash" /> Eliminar
              </button>
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}

export default function CatalogPage() {
  const { user } = useAuth()
  const api = useApi()
  const [category, setCategory] = useState('Todas')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState<any[]>([])
  const [chips, setChips] = useState<string[]>(['Todas'])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const [prods, cats] = await Promise.all([api.get('/api/products'), api.get('/api/categories')])
        const users = await api.get('/api/users').catch(() => [])
        const imgs = await api.get('/api/product-images').catch(() => [])
        setChips(['Todas', ...cats.map((c: any) => c.name)])
        setProducts(prods.map((p: any) => {
          const cat = cats.find((c: any) => c.id === p.category_id)
          const seller = users.find((u: any) => u.id === p.seller_id)
          const img = imgs.find((i: any) => i.product_id === p.id && i.is_main) || imgs.find((i: any) => i.product_id === p.id)
          return {
            id: p.id,
            name: p.title,
            category: cat ? cat.name : 'General',
            price: `$${Number(p.price).toFixed(2)}`,
            oldPrice: null,
            image: localImg(img ? img.image_url : ''),
            farmer: seller ? `${seller.firstName} ${seller.lastName}` : 'Vendedor',
            location: seller?.location || '',
            rating: Number(p.rating || 0).toFixed(1),
            reviews: Number(p.reviews || 0),
            stock: Number(p.stock || 0),
            organic: false,
            seller_id: p.seller_id,
          }
        }))
      } catch (e) {
        setProducts([])
      }
      setLoaded(true)
    })()
  }, [])

  async function deleteProduct(id: number) {
    if (!confirm('¿Eliminar producto?')) return
    try {
      await api.del(`/api/products?id=${id}`)
      setProducts(products.filter(p => p.id !== id))
    } catch (e: any) {
      alert(e.message)
    }
  }

  const filtered = products.filter(p => {
    if (category !== 'Todas' && p.category !== category) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    if (user?.role === 'Vendedor' && user?.id) {
      const aMine = a.seller_id === user.id ? 0 : 1
      const bMine = b.seller_id === user.id ? 0 : 1
      return aMine - bMine
    }
    return 0
  })

  return (
    <Layout>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{
          background: 'var(--bg-card-alt)',
          borderRadius: 14, padding: '18px 20px', position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4 }}>MarketKrop</h1>
            <p style={{ color: '#8B949E', fontSize: 13, marginBottom: 12 }}>
              Productos agrícolas directo del campo.
            </p>
            <div style={{ position: 'relative', maxWidth: '100%' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6a7580', fontSize: 12 }} />
              <input type="text" placeholder="Buscar productos..." value={search} onChange={e => setSearch(e.target.value)}
                style={{ width: '100%', padding: '8px 12px 8px 34px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 13 }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', overflowX: 'auto', paddingBottom: 4 }}>
          {chips.map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{
              padding: '4px 12px', borderRadius: 20, fontSize: 11, border: '1px solid var(--border-color)',
              background: category === c ? '#D4A843' : 'transparent', color: category === c ? '#000' : '#8B949E',
              cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: category === c ? 600 : 400
            }}>{c}</button>
          ))}
        </div>

        {loaded && filtered.length === 0 && (
          <div style={{ padding: '36px 20px', textAlign: 'center', color: '#6a7580', fontSize: 13, background: 'var(--bg-card2)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
            <i className="fas fa-box-open" style={{ fontSize: 26, display: 'block', marginBottom: 10, color: 'rgba(212,168,67,0.3)' }} />
            Aún no hay productos publicados
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
          {filtered.map(p => <ProductCard key={p.id} p={p} onDelete={deleteProduct} />)}
        </div>

        {user?.role === 'Vendedor' && (
          <div style={{ marginTop: 18 }}>
            <div style={{
              background: 'var(--bg-card2)',
              borderRadius: 14, padding: '16px 18px', marginBottom: 14
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Gestión de Productos</h2>
                  <p style={{ color: '#8B949E', fontSize: 12 }}>Administra tu inventario.</p>
                </div>
                <button className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }} onClick={() => window.location.href = '/inventory'}>
                  <i className="fas fa-warehouse" /> Ir a Inventario
                </button>
              </div>
            </div>
          </div>
        )}

        {user?.role === 'Administrador' && (
          <div style={{ marginTop: 18 }}>
            <div style={{
              background: 'var(--bg-card-alt)',
              borderRadius: 14, padding: '16px 18px', marginBottom: 14
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>Gestión de Plataforma</h2>
                  <p style={{ color: '#8B949E', fontSize: 12 }}>Administra productos y categorías.</p>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }} onClick={() => window.location.href = '/classifications'}>
                    <i className="fas fa-tags" /> Categorías
                  </button>
                  <button className="btn btn-sm btn-secondary" onClick={() => window.location.href = '/reports'}>
                    <i className="fas fa-chart-bar" /> Reportes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </Layout>
  )
}