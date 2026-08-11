'use client'
import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useApi } from '@/lib/apiClient'

function slugify(name: string): string {
  return name.trim().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function ClassificationsPage() {
  const api = useApi()
  const [cats, setCats] = useState<any[]>([])
  const [subs, setSubs] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editCat, setEditCat] = useState<any>(null)
  const [form, setForm] = useState({ name: '' })

  function loadAll() {
    Promise.all([
      api.get('/api/categories'),
      api.get('/api/products').catch(() => []),
    ]).then(([categories, products]: any[]) => {
      const counts = (id: number) => products.filter((p: any) => p.category_id === id).length
      setCats(categories.map((c: any) => ({
        id: c.id, name: c.name, slug: slugify(c.name), count: counts(c.id),
      })))
      setSubs(products.map((p: any) => {
        const cat: any = categories.find((c: any) => c.id === p.category_id)
        return { id: p.id, cat: cat ? cat.name : 'General', name: p.title, count: Number(p.stock || 0) }
      }))
    }).catch(() => { setCats([]); setSubs([]) }).finally(() => setLoaded(true))
  }

  useEffect(() => { loadAll() }, [])

  function openCreate() { setEditCat(null); setForm({ name: '' }); setShowModal(true) }
  function openEdit(c: any) { setEditCat(c); setForm({ name: c.name }); setShowModal(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editCat) await api.put(`/api/categories?id=${editCat.id}`, { name: form.name })
      else await api.post('/api/categories', { name: form.name, description: null })
      loadAll()
      setShowModal(false)
    } catch (e: any) { alert(e.message || 'Error al guardar') }
  }

  async function deleteCat(id: number) {
    if (!confirm('¿Eliminar clasificación?')) return
    try {
      await api.del(`/api/categories?id=${id}`)
      loadAll()
    } catch (e: any) { alert(e.message) }
  }

  return (
    <Layout>
      <div style={{
        background: 'var(--bg-card-alt)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Clasificaciones</h1>
            <p style={{ color: '#8B949E', fontSize: 12 }}>Gestiona categorías y subcategorías.</p>
          </div>
          <button className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }} onClick={openCreate}>
            <i className="fas fa-plus" /> Nueva Categoría
          </button>
        </div>
      </div>

      {loaded && cats.length === 0 && (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#6a7580', fontSize: 13, background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', marginBottom: 14 }}>
          <i className="fas fa-tags" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: 'rgba(212,168,67,0.3)' }} />
          No hay categorías todavía.
        </div>
      )}

      <div className="grid-2" style={{ gap: 14 }}>
        <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Categorías</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th className="hide-mob">Slug</th><th>Productos</th><th style={{ textAlign: 'center' }}>Acción</th></tr>
              </thead>
              <tbody>
                {cats.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{c.name}</td>
                    <td className="hide-mob" style={{ fontSize: 11, color: '#6a7580' }}>{c.slug}</td>
                    <td style={{ fontSize: 12, fontFamily: 'Inter' }}>{c.count}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                        <button onClick={() => openEdit(c)} className="icon-btn" style={{ width: 26, height: 26, fontSize: 10 }}><i className="fas fa-edit" /></button>
                        <button onClick={() => deleteCat(c.id)} className="icon-btn" style={{ width: 26, height: 26, fontSize: 10, color: 'var(--accent-red)' }}><i className="fas fa-trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 10 }}>Subcategorías</h2>
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Nombre</th><th className="hide-mob">Categoría</th><th>Stock</th></tr>
              </thead>
              <tbody>
                {subs.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontSize: 12, fontWeight: 500 }}>{s.name}</td>
                    <td className="hide-mob" style={{ fontSize: 11, color: '#6a7580' }}>{s.cat}</td>
                    <td style={{ fontSize: 12, fontFamily: 'Inter' }}>{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ padding: 20, margin: 16 }}>
          <h2 style={{ fontSize: 17 }}><i className="fas fa-tag" style={{ color: '#D4A843' }} /> {editCat ? 'Editar' : 'Nueva Categoría'}</h2>
          <form onSubmit={handleSave}>
            <div className="form-group"><label>Nombre</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label>Slug (autogenerado)</label><input type="text" value={slugify(form.name || '')} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} /></div>
            <div className="form-actions" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }}>
                <i className="fas fa-save" /> {editCat ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>}
    </Layout>
  )
}