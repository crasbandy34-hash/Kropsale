'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'

function AdminSettings() {
  return (
    <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 18 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Configuración de Administración</h3>
      <div className="grid-2" style={{ gap: 14 }}>
        <div className="form-group"><label>Usuarios activos</label><input type="text" value="60" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
        <div className="form-group"><label>Productos registrados</label><input type="text" value="856" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
        <div className="form-group"><label>Ventas del mes</label><input type="text" value="$18,450" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
        <div className="form-group"><label>Notificaciones activas</label><input type="text" value="3" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
      </div>
      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(212,168,67,0.08)', borderRadius: 8, border: '1px solid rgba(212,168,67,0.15)' }}>
        <span style={{ fontSize: 11, color: '#D4A843' }}><i className="fas fa-shield-halved" style={{ marginRight: 4 }} />Tu rol: Administrador — Acceso completo a todas las funciones de gestión.</span>
      </div>
    </div>
  )
}

function SellerSettings() {
  return (
    <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 18 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Configuración de Vendedor</h3>
      <div className="grid-2" style={{ gap: 14 }}>
        <div className="form-group"><label>Productos activos</label><input type="text" value="5" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
        <div className="form-group"><label>Ventas este mes</label><input type="text" value="$7,450" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
        <div className="form-group"><label>Pedidos pendientes</label><input type="text" value="3" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
        <div className="form-group"><label>Calificación</label><input type="text" value="4.8" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
      </div>
      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(139,125,107,0.08)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: 11, color: '#8B7D6B' }}><i className="fas fa-store" style={{ marginRight: 4 }} />Tu rol: Vendedor — Gestiona tu inventario y ventas.</span>
      </div>
    </div>
  )
}

function BuyerSettings() {
  return (
    <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 18 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Configuración de Comprador</h3>
      <div className="grid-2" style={{ gap: 14 }}>
        <div className="form-group"><label>Pedidos realizados</label><input type="text" value="8" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
        <div className="form-group"><label>Total gastado</label><input type="text" value="$1,240" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
        <div className="form-group"><label>Favoritos</label><input type="text" value="5" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
        <div className="form-group"><label>Reseñas escritas</label><input type="text" value="3" disabled style={{ opacity: 0.6, fontFamily: 'Inter' }} /></div>
      </div>
      <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(74,90,106,0.08)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
        <span style={{ fontSize: 11, color: 'var(--accent-slate)' }}><i className="fas fa-shopping-basket" style={{ marginRight: 4 }} />Tu rol: Comprador — Explora y compra productos agrícolas.</span>
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [form, setForm] = useState({
    firstName: user?.firstName || 'Usuario',
    lastName: user?.lastName || '',
    email: user?.email || '',
    role: user?.role || 'Comprador',
    location: user?.location || '',
    phone: '',
    bio: ''
  })
  const [saved, setSaved] = useState(false)

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <Layout>
      <div style={{
        background: 'var(--bg-card-alt)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14
      }}>
        <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Configuración</h1>
        <p style={{ color: '#8B949E', fontSize: 12 }}>Administra tu perfil.</p>
      </div>

      {saved && <div style={{
        background: 'rgba(139,125,107,0.12)', border: '1px solid var(--border-color)',
        borderRadius: 8, padding: '10px 14px', marginBottom: 14, color: 'var(--accent-stone)', fontSize: 12
      }}>
        <i className="fas fa-check-circle" style={{ marginRight: 6 }} />Cambios guardados.
      </div>}

      {form.role === 'Administrador' && <AdminSettings />}
      {form.role === 'Vendedor' && <SellerSettings />}
      {form.role === 'Comprador' && <BuyerSettings />}

      <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 18, marginTop: 14 }}>
        <form onSubmit={handleSave}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-amber)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700, color: '#000', flexShrink: 0
            }}>{form.firstName[0]}{form.lastName?.[0]}</div>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600 }}>{form.firstName} {form.lastName}</h2>
              <p style={{ color: '#8B949E', fontSize: 12 }}>{form.role}</p>
            </div>
            <button type="button" className="btn btn-sm btn-secondary" style={{ marginLeft: 'auto' }}>
              <i className="fas fa-camera" /> Foto
            </button>
          </div>

          <div className="grid-2" style={{ gap: 14 }}>
            <div className="form-group"><label>Nombre</label><input type="text" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} /></div>
            <div className="form-group"><label>Apellido</label><input type="text" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} /></div>
            <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} /></div>
            <div className="form-group"><label>Teléfono</label><input type="text" value={form.phone} onChange={(e) => update('phone', e.target.value)} /></div>
            <div className="form-group"><label>Ubicación</label><input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} /></div>
            <div className="form-group"><label>Rol</label><input type="text" value={form.role} disabled style={{ opacity: 0.6 }} /></div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Biografía</label><textarea rows={3} value={form.bio} onChange={(e) => update('bio', e.target.value)} /></div>
          </div>

          <div className="form-actions" style={{ marginTop: 18 }}>
            <button type="button" className="btn btn-sm btn-secondary">Cancelar</button>
            <button type="submit" className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }}>
              <i className="fas fa-save" /> Guardar
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
