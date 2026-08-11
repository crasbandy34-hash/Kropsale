'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Register() {
  const router = useRouter()
  const { register, loading } = useAuth()
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirmPassword: '', role: 'Comprador', location: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  function update(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    if (form.password !== form.confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }
    try {
      await register({ firstName: form.firstName, lastName: form.lastName, email: form.email, password: form.password, role: form.role, location: form.location })
      setSuccess('Registro exitoso. Redirigiendo...')
      setTimeout(() => router.push('/login'), 2000)
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (loading) return null

  return (
    <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column' }} className="flex-wrap">
      <div style={{
        flex: '1 1 auto', background: 'var(--bg-card-alt)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '24px 20px', position: 'relative', overflow: 'hidden', minHeight: 200
      }} className="auth-hero">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', margin: '0 auto 12px', background: '#E0D8C8', boxShadow: '0 8px 32px rgba(212,168,67,0.3)' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6, color: '#fff' }}>
            Krop <span style={{ color: '#D4A843' }}>Sale</span>
          </h1>
          <p style={{ color: '#8B949E', fontSize: 13, lineHeight: 1.5 }}>
            Únete a la red agrícola más grande del país.
          </p>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', padding: '20px 16px'
      }}>
        <div style={{
          width: '100%', maxWidth: 440, background: '#1e2a3a', borderRadius: 16,
          padding: '24px 20px', border: '1px solid var(--border-color)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
          maxHeight: '90vh', overflowY: 'auto'
        }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 4, color: '#fff' }}>Crear Cuenta</h2>
            <p style={{ color: '#8B949E', fontSize: 13 }}>Completa tus datos para registrarte</p>
          </div>

          {error && <div style={{
            background: 'rgba(139,64,64,0.12)', border: '1px solid rgba(139,64,64,0.2)',
            borderRadius: 10, padding: 10, marginBottom: 16, color: '#fca5a5', fontSize: 13
          }}><i className="fas fa-circle-exclamation" style={{ marginRight: 8 }} />{error}</div>}

          {success && <div style={{
            background: 'rgba(139,125,107,0.12)', border: '1px solid var(--border-color)',
            borderRadius: 10, padding: 10, marginBottom: 16, color: 'var(--accent-stone)', fontSize: 13
          }}><i className="fas fa-check-circle" style={{ marginRight: 8 }} />{success}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {['firstName', 'lastName'].map(field => (
              <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#8B949E', fontWeight: 500 }}>{field === 'firstName' ? 'Nombre' : 'Apellido'}</label>
                <input type="text" placeholder={field === 'firstName' ? 'Juan' : 'Pérez'} value={form[field as keyof typeof form] as string} onChange={(e) => update(field, e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: '#1a2332', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 13 }} required />
              </div>
            ))}
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#8B949E', fontWeight: 500 }}>Correo Electrónico</label>
              <input type="email" placeholder="correo@ejemplo.com" value={form.email} onChange={(e) => update('email', e.target.value)}
                style={{ width: '100%', padding: '9px 12px', backgroundColor: '#1a2332', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 13 }} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {['password', 'confirmPassword'].map(field => (
              <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#8B949E', fontWeight: 500 }}>{field === 'password' ? 'Contraseña' : 'Confirmar'}</label>
                <input type="password" placeholder="••••••••" value={form[field as keyof typeof form] as string} onChange={(e) => update(field, e.target.value)}
                  style={{ width: '100%', padding: '9px 12px', backgroundColor: '#1a2332', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 13 }} required />
              </div>
            ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
              {['role', 'location'].map(field => (
              <div key={field} className="form-group" style={{ marginBottom: 0 }}>
                <label style={{ display: 'block', marginBottom: 4, fontSize: 12, color: '#8B949E', fontWeight: 500 }}>{field === 'role' ? 'Rol' : 'Ubicación'}</label>
                {field === 'role' ? (
                  <select value={form.role} onChange={(e) => update('role', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: '#1a2332', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 13 }}>
                    <option value="Comprador">Comprador</option>
                    <option value="Vendedor">Vendedor</option>
                  </select>
                ) : (
                  <input type="text" placeholder="Ciudad" value={form.location} onChange={(e) => update('location', e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', backgroundColor: '#1a2332', border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 13 }} />
                )}
              </div>
            ))}
            </div>
            <button type="submit" style={{
              width: '100%', padding: '12px', backgroundColor: '#D4A843', color: '#000',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              transition: 'all .3s ease'
            }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c09530')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#D4A843')}>
              <i className="fas fa-user-plus" style={{ marginRight: 8 }} />Crear Cuenta
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 16, color: '#8B949E', fontSize: 13 }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/login" style={{ color: '#D4A843', fontWeight: 600, textDecoration: 'none' }}>
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
