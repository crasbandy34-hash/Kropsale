'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'

export default function Login() {
  const router = useRouter()
  const { login, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      await login(email, password)
      router.push('/dashboard')
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
        padding: '30px 20px', position: 'relative', overflow: 'hidden', minHeight: 260
      }} className="auth-hero">
        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 360 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, overflow: 'hidden', margin: '0 auto 16px', background: '#E0D8C8', boxShadow: '0 8px 32px rgba(212,168,67,0.3)' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#fff' }}>
            Krop <span style={{ color: '#D4A843' }}>Sale</span>
          </h1>
          <p style={{ color: '#8B949E', fontSize: 14, lineHeight: 1.5 }}>
            La plataforma líder para la comercialización de productos agrícolas.
          </p>
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-primary)', padding: '24px 16px'
      }}>
        <div style={{
          width: '100%', maxWidth: 400, background: '#1e2a3a', borderRadius: 16,
          padding: '28px 24px', border: '1px solid var(--border-color)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
        }}>
          <div style={{ marginBottom: 24 }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#8B949E', fontSize: 12, marginBottom: 12, textDecoration: 'none' }}>
              <i className="fas fa-arrow-left" /> Volver al inicio
            </Link>
            <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 6, color: '#fff' }}>Iniciar Sesión</h2>
            <p style={{ color: '#8B949E', fontSize: 13 }}>Ingresa tus credenciales</p>
          </div>

          {error && <div style={{
            background: 'rgba(139,64,64,0.12)', border: '1px solid rgba(139,64,64,0.2)',
            borderRadius: 10, padding: 10, marginBottom: 16, color: '#fca5a5', fontSize: 13
          }}><i className="fas fa-circle-exclamation" style={{ marginRight: 8 }} />{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#8B949E', fontWeight: 500 }}>Correo Electrónico</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-envelope" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6a7580', fontSize: 13 }} />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', backgroundColor: '#1a2332', border: '1px solid var(--border-color)', borderRadius: 10, color: '#fff', fontSize: 14 }}
                  placeholder="correo@ejemplo.com" required />
              </div>
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, color: '#8B949E', fontWeight: 500 }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <i className="fas fa-lock" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6a7580', fontSize: 13, zIndex: 1 }} />
                <input type={showPw ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px 10px 38px', backgroundColor: '#1a2332', border: '1px solid var(--border-color)', borderRadius: 10, color: '#fff', fontSize: 14 }}
                  placeholder="••••••••" required />
                <button type="button" onClick={() => setShowPw(!showPw)} style={{
                  position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', color: '#6a7580', cursor: 'pointer', fontSize: 14, padding: 4
                }}>
                  <i className={'fas ' + (showPw ? 'fa-eye-slash' : 'fa-eye')} />
                </button>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#8B949E', cursor: 'pointer' }}>
                <input type="checkbox" defaultChecked style={{ accentColor: '#D4A843' }} />
                Recordarme
              </label>
              <a href="#" style={{ color: '#D4A843', fontSize: 12 }}>¿Olvidaste tu contraseña?</a>
            </div>
            <button type="submit" style={{
              width: '100%', padding: '12px', backgroundColor: '#D4A843', color: '#000',
              border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer',
              transition: 'all .3s ease'
            }}
              onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#c09530')}
              onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#D4A843')}>
              <i className="fas fa-right-to-bracket" style={{ marginRight: 8 }} />Iniciar Sesión
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, color: '#8B949E', fontSize: 13 }}>
            ¿No tienes cuenta?{' '}
            <Link href="/register" style={{ color: '#D4A843', fontWeight: 600, textDecoration: 'none' }}>
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
