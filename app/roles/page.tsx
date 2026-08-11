'use client'
import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useApi } from '@/lib/apiClient'

export default function RolesPage() {
  const api = useApi()
  const [roles, setRoles] = useState<any[]>([])
  const [allPermissions, setAllPermissions] = useState<string[]>([])
  const [loaded, setLoaded] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editRole, setEditRole] = useState<any>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [selectedPerms, setSelectedPerms] = useState<string[]>([])

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    try {
      const [rolesRows, perms, rps, users] = await Promise.all([
        api.get('/api/roles'),
        api.get('/api/permissions'),
        api.get('/api/role-permissions').catch(() => []),
        api.get('/api/users').catch(() => []),
      ])
      setAllPermissions(perms.map((p: any) => p.name))
      setRoles(rolesRows.map((r: any) => {
        const assigned = rps.filter((rp: any) => rp.role_id === r.id).map((rp: any) => rp.permission_name)
        return {
          id: r.id, name: r.name, description: r.description || '',
          users: users.filter((u: any) => u.role === r.name).length,
          permissions: assigned,
        }
      }))
    } catch { setRoles([]) }
    setLoaded(true)
  }

  function openCreate() { setEditRole(null); setForm({ name: '', description: '' }); setSelectedPerms([]); setShowModal(true) }
  function openEdit(role: any) { setEditRole(role); setForm({ name: role.name, description: role.description }); setSelectedPerms(role.permissions); setShowModal(true) }
  function togglePerm(p: string) { setSelectedPerms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]) }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    try {
      let roleId = editRole?.id
      if (editRole) {
        await api.put(`/api/roles?id=${editRole.id}`, { name: form.name, description: form.description })
      } else {
        const res = await api.post('/api/roles', { name: form.name, description: form.description })
        roleId = res.id
      }
      const currentPerms = editRole ? editRole.permissions : []
      for (const p of currentPerms) {
        if (!selectedPerms.includes(p)) {
          const perm = (await api.get('/api/permissions')).find((x: any) => x.name === p)
          if (perm) await api.del(`/api/role-permissions?role_id=${roleId}&permission_id=${perm.id}`)
        }
      }
      for (const p of selectedPerms) {
        if (!currentPerms.includes(p)) {
          const perm = (await api.get('/api/permissions')).find((x: any) => x.name === p)
          if (perm) await api.post('/api/role-permissions', { role_id: roleId, permission_id: perm.id })
        }
      }
      await loadAll()
      setShowModal(false)
    } catch (e: any) {
      alert(e.message || 'Error al guardar')
    }
  }

  async function deleteRole(id: number) {
    const role = roles.find(r => r.id === id)
    if (!role) return
    if (role.users > 0) { alert('No puedes eliminar un rol con usuarios asignados'); return }
    if (!confirm(`¿Eliminar rol ${role.name}?`)) return
    try {
      await api.del(`/api/roles?id=${id}`)
      await loadAll()
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
            <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Roles</h1>
            <p style={{ color: '#8B949E', fontSize: 12 }}>Gestiona roles y permisos.</p>
          </div>
          <button className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }} onClick={openCreate}>
            <i className="fas fa-plus" /> Nuevo Rol
          </button>
        </div>
      </div>

      {loaded && roles.length === 0 && (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#6a7580', fontSize: 13, background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)' }}>
          <i className="fas fa-shield-halved" style={{ fontSize: 24, display: 'block', marginBottom: 8, color: 'rgba(212,168,67,0.3)' }} />
          No hay roles.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
        {roles.map(role => (
          <div key={role.id} style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{role.name}</h3>
                <p style={{ color: '#8B949E', fontSize: 12 }}>{role.description}</p>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: 10, fontSize: 10, background: 'rgba(212,168,67,0.12)', color: '#D4A843', whiteSpace: 'nowrap', fontFamily: 'Inter' }}>{role.users} usuarios</span>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: '#6a7580', marginBottom: 6, fontFamily: 'Inter' }}>Permisos ({role.permissions.length})</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
                {role.permissions.slice(0, 4).map((p: string) => (
                  <span key={p} style={{ padding: '2px 6px', borderRadius: 3, background: 'rgba(255,255,255,0.06)', color: '#8B949E', fontSize: 9 }}>{p}</span>
                ))}
                {role.permissions.length > 4 && <span style={{ fontSize: 9, color: '#6a7580', fontFamily: 'Inter' }}>+{role.permissions.length - 4}</span>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(role)} className="btn btn-sm btn-secondary" style={{ flex: 1, fontSize: 11 }}><i className="fas fa-edit" /> Editar</button>
              <button onClick={() => deleteRole(role.id)} className="btn btn-sm btn-secondary" style={{ color: 'var(--accent-red)' }}><i className="fas fa-trash" /></button>
            </div>
          </div>
        ))}
      </div>

      {showModal && <div className="modal-overlay" onClick={() => setShowModal(false)}>
        <div className="modal fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, padding: 20, margin: 16 }}>
          <h2 style={{ fontSize: 17 }}><i className="fas fa-shield-halved" style={{ color: '#D4A843' }} /> {editRole ? 'Editar Rol' : 'Nuevo Rol'}</h2>
          <form onSubmit={handleSave}>
            <div className="form-group"><label>Nombre</label><input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
            <div className="form-group"><label>Descripción</label><textarea rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
            <div className="form-group">
              <label>Permisos</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, maxHeight: 200, overflowY: 'auto', padding: '6px', background: 'rgba(0,0,0,0.15)', borderRadius: 6 }}>
                {allPermissions.map(p => (
                  <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 6px', borderRadius: 3, cursor: 'pointer', fontSize: 11, color: selectedPerms.includes(p) ? '#fff' : '#8B949E', background: selectedPerms.includes(p) ? 'rgba(212,168,67,0.12)' : 'transparent' }}>
                    <input type="checkbox" checked={selectedPerms.includes(p)} onChange={() => togglePerm(p)} style={{ accentColor: '#D4A843' }} />
                    {p}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-actions" style={{ flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-sm btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button type="submit" className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }}>
                <i className="fas fa-save" /> {editRole ? 'Guardar' : 'Crear'}
              </button>
            </div>
          </form>
        </div>
      </div>}
    </Layout>
  )
}