'use client'
import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useAuth } from '@/context/AuthContext'
import { useApi, fmtDate } from '@/lib/apiClient'

const roles = ['Todos', 'Administrador', 'Vendedor', 'Comprador']
const statuses = ['Todos', 'Activo', 'Inactivo']

export default function UsersPage() {
  const { user } = useAuth()
  const api = useApi()
  const [users, setUsers] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)
  const [roleFilter, setRoleFilter] = useState('Todos')
  const [statusFilter, setStatusFilter] = useState('Todos')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<any>(null)
  const [form, setForm] = useState({ name: '', email: '', role: 'Comprador', location: '', password: '' })

  useEffect(() => {
    ;(async () => {
      try {
        const rows = await api.get('/api/users')
        setUsers(rows.map((u: any) => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          role: u.role,
          status: u.isActive ? 'Activo' : 'Inactivo',
          isActive: !!u.isActive,
          location: u.location || '',
          registered: fmtDate(u.createdAt),
        })))
      } catch { setUsers([]) }
      setLoaded(true)
    })()
  }, [])

  const filtered = users.filter(u => {
    if (roleFilter !== 'Todos' && u.role !== roleFilter) return false
    if (statusFilter !== 'Todos' && u.status !== statusFilter) return false
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  function openCreate() { setEditUser(null); setForm({ name: '', email: '', role: 'Comprador', location: '', password: '' }); setShowModal(true) }
  function openEdit(u: any) { setEditUser(u); setForm({ name: u.name, email: u.email, role: u.role, location: u.location, password: '' }); setShowModal(true) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    const parts = form.name.trim().split(/\s+/)
    const body = {
      firstName: parts[0] || form.name,
      lastName: parts.slice(1).join(' ') || '-',
      email: form.email,
      location: form.location,
      role: form.role,
    }
    try {
      if (editUser) {
        await api.put(`/api/users?id=${editUser.id}`, body)
      } else {
        await api.post('/api/users', { ...body, password: form.password })
      }
      const rows = await api.get('/api/users')
      setUsers(rows.map((u: any) => ({
        id: u.id, name: `${u.firstName} ${u.lastName}`, firstName: u.firstName, lastName: u.lastName,
        email: u.email, role: u.role, status: u.isActive ? 'Activo' : 'Inactivo', isActive: !!u.isActive,
        location: u.location || '', registered: fmtDate(u.createdAt),
      })))
      setShowModal(false)
    } catch (e: any) {
      alert(e.message || 'Error al guardar')
    }
  }

  async function toggleStatus(id: number) {
    const u = users.find(x => x.id === id)
    if (!u) return
    try {
      await api.put(`/api/users?id=${id}`, { isActive: u.isActive ? 0 : 1 })
      setUsers(users.map(x => x.id === id ? { ...x, status: x.status === 'Activo' ? 'Inactivo' : 'Activo', isActive: !x.isActive } : x))
    } catch (e: any) { alert(e.message) }
  }

  async function deleteUser(id: number) {
    if (id === user?.id) { alert('No puedes eliminar tu propia cuenta'); return }
    if (!confirm('¿Eliminar usuario?')) return
    try {
      await api.del(`/api/users?id=${id}`)
      setUsers(users.filter(u => u.id !== id))
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
            <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Usuarios</h1>
            <p style={{ color: '#8B949E', fontSize: 12 }}>Administra los usuarios registrados.</p>
          </div>
          <button className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }} onClick={openCreate}>
            <i className="fas fa-plus" /> Nuevo
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 160, maxWidth: 300 }}>
          <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6a7580', fontSize: 11 }} />
          <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '7px 10px 7px 30px', background: '#1e2a3a', border: '1px solid var(--border-color)', borderRadius: 6, color: '#fff', fontSize: 12 }} />
        </div>
        {[{ val: roleFilter, set: setRoleFilter, options: roles }, { val: statusFilter, set: setStatusFilter, options: statuses }].map((f, i) => (
          <div key={i} style={{ display: 'flex', gap: 4 }}>
            {f.options.map(o => (
              <button key={o} onClick={() => f.set(o)} style={{
                padding: '4px 10px', borderRadius: 20, fontSize: 10, border: '1px solid var(--border-color)',
                background: f.val === o ? '#D4A843' : 'transparent', color: f.val === o ? '#000' : '#8B949E', cursor: 'pointer'
              }}>{o}</button>
            ))}
          </div>
        ))}
      </div>

      {loaded && filtered.length === 0 && (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#6a7580', fontSize: 13, background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)' }}>
          <i className="fas fa-users" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: 'rgba(212,168,67,0.3)' }} />
          No hay usuarios con esos filtros.
        </div>
      )}

      <div className="table-wrap" style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)' }}>
        <table>
          <thead>
            <tr>
              <th>Usuario</th>
              <th className="hide-mob">Email</th>
              <th>Rol</th>
              <th className="hide-mob">Estado</th>
              <th style={{ textAlign: 'center' }}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' }}>{u.name}</td>
                <td className="hide-mob" style={{ fontSize: 12, color: '#8B949E' }}>{u.email}</td>
                <td><span className="status-badge" style={{ fontSize: 9, background: u.role === 'Administrador' ? 'rgba(212,168,67,0.12)' : u.role === 'Vendedor' ? 'rgba(139,125,107,0.12)' : 'rgba(74,90,106,0.12)', color: u.role === 'Administrador' ? '#D4A843' : u.role === 'Vendedor' ? '#8B7D6B' : 'var(--accent-slate)' }}>{u.role}</span></td>
                <td className="hide-mob">
                  <button onClick={() => toggleStatus(u.id)} className="status-badge" style={{ fontSize: 9, cursor: 'pointer', border: 'none', background: u.status === 'Activo' ? 'rgba(139,125,107,0.12)' : 'rgba(139,64,64,0.12)', color: u.status === 'Activo' ? 'var(--accent-stone)' : 'var(--accent-red)' }}>
                    <span className="badge-dot" style={{ background: u.status === 'Activo' ? '#8B7D6B' : 'var(--accent-red)' }} />
                    {u.status}
                  </button>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
                    <button onClick={() => openEdit(u)} className="icon-btn" style={{ width: 28, height: 28, fontSize: 10 }}><i className="fas fa-edit" /></button>
                    <button onClick={() => deleteUser(u.id)} className="icon-btn" style={{ width: 28, height: 28, fontSize: 10, color: 'var(--accent-red)' }}><i className="fas fa-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ padding: 20, margin: 16 }}>
          <h2 style={{ fontSize: 17 }}><i className="fas fa-user" style={{ color: '#D4A843' }} /> {editUser ? 'Editar' : 'Nuevo Usuario'}</h2>
          <form onSubmit={handleSave}>
            <div className="form-group"><label>Nombre Completo</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required /></div>
            <div className="form-group"><label>Rol</label>
              <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="Administrador">Admin</option>
                <option value="Vendedor">Vendedor</option>
                <option value="Comprador">Comprador</option>
              </select>
            </div>
            <div className="form-group"><label>Ubicación</label><input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} /></div>
            {!editUser && <div className="form-group"><label>Contraseña</label><input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required /></div>}
            <div className="form-actions" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }}>
                <i className="fas fa-save" /> {editUser ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>}
    </Layout>
  )
}