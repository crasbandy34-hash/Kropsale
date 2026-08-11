'use client'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'

function RoleFAQ() {
  const { user } = useAuth()
  const role = user?.role || 'Comprador'
  if (role === 'Administrador') {
    return [
      { q: '¿Cómo gestionar usuarios?', a: 'Ve a "Usuarios" en el menú lateral para crear, editar o eliminar cuentas.' },
      { q: '¿Cómo ver reportes de la plataforma?', a: 'Accede a "Reportes" desde el menú para ver estadísticas generales.' },
      { q: '¿Cómo gestionar roles y permisos?', a: 'Ve a "Roles" para configurar permisos por rol de usuario.' },
    ]
  }
  if (role === 'Vendedor') {
    return [
      { q: '¿Cómo publico un producto?', a: 'Ve a "Mi Inventario" y haz clic en "Agregar Producto".' },
      { q: '¿Cómo gestiono mis ventas?', a: 'En "Mis Ventas" puedes ver y gestionar tus transacciones.' },
      { q: '¿Cómo cambiar el stock de mis productos?', a: 'Edita cualquier producto en tu inventario para actualizar el stock.' },
    ]
  }
  return [
    { q: '¿Cómo compro un producto?', a: 'Busca en el Catálogo, selecciona un producto y haz clic en "Agregar".' },
    { q: '¿Cómo callo la entrega?', a: 'En "Mis Pedidos" puedes ver el estado de tus envíos.' },
    { q: '¿Cómo dejo una reseña?', a: 'Ve a "Reseñas" y califica los productos que has comprado.' },
  ]
}

export default function SupportPage() {
  const { user } = useAuth()
  const role = user?.role || 'Comprador'
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState(false)

  function update(field: string, value: string) { setForm(prev => ({ ...prev, [field]: value })) }

  function handleSubmit(e: React.FormEvent) { e.preventDefault(); setSent(true) }

  const roleLabel = role === 'Administrador' ? 'Administrador' : role === 'Vendedor' ? 'Vendedor' : 'Comprador'
  const roleIcon = role === 'Administrador' ? 'fa-shield-halved' : role === 'Vendedor' ? 'fa-store' : 'fa-shopping-basket'
  const roleColor = role === 'Administrador' ? '#D4A843' : role === 'Vendedor' ? '#8B7D6B' : 'var(--accent-slate)'

  return (
    <Layout>
      <div style={{
        background: 'var(--bg-card-alt)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14
      }}>
        <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Soporte Técnico</h1>
        <p style={{ color: '#8B949E', fontSize: 12 }}>Estamos aquí para ayudarte.</p>
      </div>

      <div className="grid-2" style={{ gap: 14 }}>
        <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 18 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
            <i className={`fas ${roleIcon}`} style={{ color: roleColor, marginRight: 6 }} />
            Rol: {roleLabel}
          </h2>
          <p style={{ color: '#8B949E', fontSize: 12, marginBottom: 16 }}>
            {role === 'Administrador' ? 'Acceso completo a todas las funciones de gestión.' : role === 'Vendedor' ? 'Gestiona tus productos y ventas.' : 'Compra y evalúa productos agrícolas.'}
          </p>

          {sent ? (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%', background: 'rgba(255,255,255,0.06)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px'
              }}>
                <i className="fas fa-check-circle" style={{ color: '#8B7D6B', fontSize: 24 }} />
              </div>
              <p style={{ color: '#8B949E', fontSize: 13 }}>Mensaje enviado. Te responderemos pronto.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group"><label>Nombre</label><input type="text" value={form.name} onChange={(e) => update('name', e.target.value)} required /></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} required /></div>
              <div className="form-group"><label>Asunto</label>
                <select value={form.subject} onChange={(e) => update('subject', e.target.value)} required>
                  <option value="">Seleccionar...</option>
                  <option value="Problema técnico">Problema técnico</option>
                  <option value="Consulta">Consulta</option>
                  <option value="Sugerencia">Sugerencia</option>
                  <option value="Pedido">Problema con pedido</option>
                  <option value="Producto">Problema con producto</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div className="form-group"><label>Mensaje</label><textarea rows={4} value={form.message} onChange={(e) => update('message', e.target.value)} required /></div>
              <button type="submit" className="btn btn-primary btn-full" style={{ background: '#D4A843', color: '#000', marginTop: 8 }}>
                <i className="fas fa-paper-plane" /> Enviar
              </button>
            </form>
          )}
        </div>

        <div>
          <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 18, marginBottom: 14 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>Contacto</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { icon: 'fa-headset', label: 'Email', value: 'soporte@kopsale.com' },
                { icon: 'fa-phone', label: 'Teléfono', value: '+51 1 234 5678' },
                { icon: 'fa-whatsapp', label: 'WhatsApp', value: '+51 999 888 777' },
              ].map(info => (
                <div key={info.label} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 8, background: 'rgba(212,168,67,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                  }}>
                    <i className={`fas ${info.icon}`} style={{ color: '#D4A843', fontSize: 13 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: '#6a7580' }}>{info.label}</div>
                    <div style={{ fontSize: 13 }}>{info.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)', padding: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>FAQ - {roleLabel}</h2>
            {RoleFAQ().map(faq => (
              <details key={faq.q} style={{ padding: '8px 12px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', cursor: 'pointer', marginBottom: 6 }}>
                <summary style={{ fontSize: 12, fontWeight: 500, color: '#8B949E' }}>{faq.q}</summary>
                <p style={{ fontSize: 12, color: '#6a7580', marginTop: 6 }}>{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
