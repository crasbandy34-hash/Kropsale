'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useApi, localImg } from '@/lib/apiClient'
import Layout from '@/components/Layout'

export default function InventoryPage() {
  const { user } = useAuth()
  const api = useApi()
  const [products, setProducts] = useState<any[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editProduct, setEditProduct] = useState<any>(null)
  const [form, setForm] = useState({ name: '', category: '', price: '', stock: '', image: '' })
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [categories, setCategories] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    ;(async () => {
      try {
        const [prods, cats, imgs] = await Promise.all([
          api.get('/api/products').catch(() => []),
          api.get('/api/categories').catch(() => []),
          api.get('/api/product-images').catch(() => []),
        ])
        setCategories(cats)
        const mine = prods.filter((p: any) => p.seller_id === user?.id)
        setProducts(mine.map((p: any) => {
          const cat = cats.find((c: any) => c.id === p.category_id)
          const img = imgs.find((i: any) => i.product_id === p.id && i.is_main) || imgs.find((i: any) => i.product_id === p.id)
          return {
            id: p.id,
            name: p.title,
            category: cat ? cat.name : 'General',
            price: Number(p.price),
            stock: Number(p.stock || 0),
            status: Number(p.stock || 0) > 0 ? 'Activo' : 'Agotado',
            image: localImg(img ? img.image_url : ''),
          }
        }))
      } catch { setProducts([]) }
      setLoaded(true)
    })()
  }, [user?.id])

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) &&
    (statusFilter === 'Todos' || p.status === statusFilter)
  )

  function openCreate() { setEditProduct(null); setForm({ name: '', category: '', price: '', stock: '', image: '' }); setShowModal(true) }
  function openEdit(p: any) { setEditProduct(p); setForm({ name: p.name, category: p.category, price: String(p.price), stock: String(p.stock), image: p.image }); setShowModal(true) }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    setUploading(true)
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al subir imagen')
      setForm({ ...form, image: data.url })
    } catch (err: any) {
      alert(err.message || 'Error al subir imagen')
    }
    setUploading(false)
  }

  async function resolveCategoryId(name: string): Promise<number> {
    const found = categories.find(c => c.name.toLowerCase() === name.trim().toLowerCase())
    if (found) return found.id
    const res = await api.post('/api/categories', { name: name.trim(), description: null })
    const fresh = await api.get('/api/categories')
    setCategories(fresh)
    return res.id || fresh[fresh.length - 1].id
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const price = parseFloat(form.price) || 0
    const stock = parseInt(form.stock) || 0
    try {
      const category_id = await resolveCategoryId(form.category || 'General')
      const status_id = stock > 0 ? 1 : 2
      if (editProduct) {
        await api.put(`/api/products?id=${editProduct.id}`, { title: form.name, price, stock, category_id, status_id })
        if (form.image) {
          await api.post('/api/product-images', { product_id: editProduct.id, image_url: form.image, is_main: 1 })
        }
      } else {
        const res = await api.post('/api/products', {
          title: form.name,
          description: '',
          price,
          stock,
          condition_id: 1,
          status_id,
          seller_id: user?.id,
          category_id,
        })
        if (form.image) {
          await api.post('/api/product-images', { product_id: res.id, image_url: form.image, is_main: 1 })
        }
      }
      const prods = await api.get('/api/products')
      const imgs = await api.get('/api/product-images').catch(() => [])
      const cats = await api.get('/api/categories')
      setProducts(prods.filter((p: any) => p.seller_id === user?.id).map((p: any) => {
        const cat = cats.find((c: any) => c.id === p.category_id)
        const img = imgs.find((i: any) => i.product_id === p.id && i.is_main) || imgs.find((i: any) => i.product_id === p.id)
        return {
          id: p.id, name: p.title, category: cat ? cat.name : 'General',
          price: Number(p.price), stock: Number(p.stock || 0),
          status: Number(p.stock || 0) > 0 ? 'Activo' : 'Agotado',
          image: localImg(img ? img.image_url : ''),
        }
      }))
      setShowModal(false)
    } catch (e: any) {
      alert(e.message || 'Error al guardar')
    }
  }

  async function deleteProduct(id: number) {
    if (!confirm('¿Eliminar producto?')) return
    try {
      await api.del(`/api/products?id=${id}`)
      setProducts(products.filter(p => p.id !== id))
    } catch (e: any) { alert(e.message) }
  }

  return (
    <Layout>
      <div style={{
        background: 'var(--bg-card2)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Inventario</h1>
            <p style={{ color: '#8B949E', fontSize: 12 }}>Gestiona tus productos.</p>
          </div>
          <button className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }} onClick={openCreate}>
            <i className="fas fa-plus" /> Añadir
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 300 }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6a7580', fontSize: 11 }} />
          <input type="text" placeholder="Buscar producto..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '7px 10px 7px 30px', background: '#1e2a3a', border: '1px solid var(--border-color)', borderRadius: 6, color: '#fff', fontSize: 12 }} />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[['Todos', 'Todos'], ['Activo', 'Activo'], ['Agotado', 'Agotado']].map(([key, label]) => (
            <button key={key} onClick={() => setStatusFilter(key)} style={{
              padding: '4px 10px', borderRadius: 20, fontSize: 10, border: '1px solid var(--border-color)',
              background: statusFilter === key ? '#D4A843' : 'transparent', color: statusFilter === key ? '#000' : '#8B949E', cursor: 'pointer', fontWeight: statusFilter === key ? 600 : 400
            }}>{label}</button>
          ))}
        </div>
      </div>

      {loaded && filtered.length === 0 && (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#6a7580', fontSize: 13, background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)' }}>
          <i className="fas fa-box-open" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: 'rgba(212,168,67,0.3)' }} />
          No tienes productos aún. Pulsa "Añadir" para publicar el primero.
        </div>
      )}

      <div className="table-wrap" style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)' }}>
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th className="hide-mob">Categoría</th>
              <th>Precio</th>
              <th>Stock</th>
              <th className="hide-mob">Estado</th>
              <th style={{ textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={p.image} alt="" style={{ width: 30, height: 30, borderRadius: 6, objectFit: 'cover' }} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>{p.name}</span>
                  </div>
                </td>
                <td className="hide-mob" style={{ fontSize: 11, color: '#6a7580' }}>{p.category}</td>
                <td style={{ fontSize: 12, color: '#D4A843', fontWeight: 600, fontFamily: 'Inter' }}>${p.price.toFixed(2)}</td>
                <td style={{ fontSize: 12, fontFamily: 'Inter' }}>{p.stock > 0 ? <span style={{ color: '#8B7D6B', fontFamily: 'Inter' }}>{p.stock}</span> : <span style={{ color: 'var(--accent-red)' }}>Agotado</span>}</td>
                <td className="hide-mob">
                  <span className="status-badge" style={{ fontSize: 9, background: p.status === 'Activo' ? 'rgba(139,125,107,0.12)' : 'rgba(139,64,64,0.12)', color: p.status === 'Activo' ? 'var(--accent-stone)' : 'var(--accent-red)' }}>
                    <span className="badge-dot" style={{ background: p.status === 'Activo' ? '#8B7D6B' : 'var(--accent-red)' }} />
                    {p.status}
                  </span>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button onClick={() => openEdit(p)} className="icon-btn" style={{ width: 28, height: 28, fontSize: 10 }}><i className="fas fa-edit" /></button>
                    <button onClick={() => deleteProduct(p.id)} className="icon-btn" style={{ width: 28, height: 28, fontSize: 10, color: 'var(--accent-red)' }}><i className="fas fa-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ padding: 20, margin: 16 }}>
          <h2 style={{ fontSize: 17 }}><i className="fas fa-box" style={{ color: '#D4A843' }} /> {editProduct ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <form onSubmit={handleSave}>
            <div className="form-group"><label>Nombre</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label>Categoría</label><input type="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Frutas, Verduras, Granos, Semillas, Herramientas..." /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group"><label>Precio</label><input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} required /></div>
              <div className="form-group"><label>Stock</label><input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: e.target.value })} required /></div>
            </div>
            <div className="form-group">
              <label>Imagen (local)</label>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <img src={form.image ? localImg(form.image) : localImg('')} alt="" style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border-color)', background: '#1e2a3a' }} />
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'inline-block', padding: '7px 14px', borderRadius: 6, background: 'rgba(212,168,67,0.12)', color: '#D4A843', border: '1px solid rgba(212,168,67,0.25)', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}>
                    <i className="fas fa-upload" style={{ marginRight: 4 }} />{uploading ? 'Subiendo...' : form.image ? 'Cambiar imagen' : 'Subir imagen'}
                    <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>
            </div>
            <div className="form-actions" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }}>
                <i className="fas fa-save" /> {editProduct ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>}
    </Layout>
  )
}