'use client'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useApi, localImg } from '@/lib/apiClient'
import { useState, useEffect } from 'react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: 'fa-th-large', roles: ['all'] },
  { path: '/users', label: 'Usuarios', icon: 'fa-users', roles: ['Administrador'] },
  { path: '/roles', label: 'Roles', icon: 'fa-shield-halved', roles: ['Administrador'] },
  { path: '/reports', label: 'Reportes', icon: 'fa-chart-bar', roles: ['Administrador'] },
  { path: '/classifications', label: 'Clasificaciones', icon: 'fa-tags', roles: ['Administrador'] },
  { path: '/catalog', label: 'MarketKrop', icon: 'fa-boxes-stacked', roles: ['all'] },
  { path: '/inventory', label: 'Inventario', icon: 'fa-warehouse', roles: ['Vendedor'] },
  { path: '/sales', label: 'Ventas', icon: 'fa-receipt', roles: ['Vendedor'] },
  { path: '/sales', label: 'Compras', icon: 'fa-receipt', roles: ['Comprador'] },
  { path: '/ratings', label: 'Reseñas', icon: 'fa-star', roles: ['Vendedor'] },
  { path: '/conversations', label: 'Mensajes', icon: 'fa-comments', roles: ['all'] },
  { path: '/notifications', label: 'Notificaciones', icon: 'fa-bell', roles: ['all'] },
  { path: '/support', label: 'Soporte', icon: 'fa-headset', roles: ['all'] },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth() || { user: null, logout: () => {} }
  const api = useApi()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => { setSidebarOpen(false) }, [pathname])

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const [conversations, messages] = await Promise.all([
          api.get('/api/conversations').catch(() => []),
          api.get('/api/messages').catch(() => []),
        ])
        const convosForMe = conversations.filter((c: any) => c.buyer_id === user.id || c.seller_id === user.id || user.role === 'Administrador')
        const count = messages.filter((m: any) =>
          convosForMe.some((c: any) => c.id === m.conversation_id) && m.sender_id !== user.id && !Number(m.is_read)
        ).length
        setUnreadCount(count)
      } catch {
        setUnreadCount(0)
      }
    })()
  }, [user?.id, user?.role, pathname])

  useEffect(() => {
    if (!user) return
    if (pathname === '/login' || pathname === '/register' || pathname === '/') return
    const matchingItems = navItems.filter(n => pathname.startsWith(n.path))
    const allowed = matchingItems.some(n => n.roles.includes('all') || n.roles.includes(user.role))
    if (matchingItems.length > 0 && !allowed) {
      router.push('/dashboard')
    }
  }, [user, pathname, router])

  const filteredNav = navItems.filter(item =>
    item.roles.includes('all') || (user && item.roles.includes(user.role))
  )

    const mobileNavItems = (() => {
    if (!user) return ['/dashboard', '/catalog', '/conversations', '/notifications', '/support', '/settings']
    if (user.role === 'Administrador') return ['/dashboard', '/catalog', '/users', '/roles', '/reports', '/classifications', '/conversations', '/notifications', '/support', '/settings']
    if (user.role === 'Vendedor') return ['/dashboard', '/catalog', '/inventory', '/sales', '/ratings', '/conversations', '/notifications', '/support', '/settings']
    if (user.role === 'Comprador') return ['/dashboard', '/catalog', '/sales', '/conversations', '/notifications', '/support', '/settings']
    return ['/dashboard', '/catalog', '/conversations', '/notifications', '/support', '/settings']
  })()

  const mobileNav = filteredNav.filter(n => mobileNavItems.includes(n.path))

  return (
    <div style={{ minHeight: '100vh', display: 'flex' }}>
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999
        }} className="show-mob" />
      )}

      <aside style={{
        width: 220, backgroundColor: 'var(--bg-secondary)',
        padding: '20px 0', flexDirection: 'column', position: 'fixed',
        top: 0, left: 0, height: '100vh', zIndex: 1000
      }} className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
<ul style={{ listStyle: 'none', padding: '0 10px', flex: 1 }}>
          {filteredNav.map(item => {
            const isActive = pathname === item.path || (item.path !== '/dashboard' && pathname.startsWith(item.path))
            return (
              <li key={item.path} style={{ marginBottom: 2 }}>
                <button onClick={() => router.push(item.path)} className="sidebar-item" style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px',
                  color: isActive ? '#000' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'var(--accent-amber)' : 'transparent',
                  border: 'none', borderRadius: 8, cursor: 'pointer', width: '100%', fontSize: 13,
                  transition: 'all .2s ease', fontWeight: isActive ? 600 : 400
                }}>
                  <i className={`fas ${item.icon}`} style={{ width: 18, textAlign: 'center', fontSize: 13 }} />
                  <span className="sidebar-nav-text">{item.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
        <div style={{ padding: '0 10px', borderTop: '1px solid var(--border-color)', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button onClick={() => router.push('/settings')} className="sidebar-item" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px',
            color: 'var(--text-secondary)', background: 'none', border: 'none', borderRadius: 8,
            cursor: 'pointer', width: '100%', fontSize: 13
          }}>
            <i className="fas fa-gear" style={{ width: 18, textAlign: 'center', fontSize: 13 }} />
            <span className="sidebar-nav-text">Configuración</span>
          </button>
          <button onClick={() => { logout(); router.push('/'); }} className="sidebar-item" style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px',
            color: 'var(--accent-red)', background: 'none', border: 'none', borderRadius: 8,
            cursor: 'pointer', width: '100%', fontSize: 13
          }}>
            <i className="fas fa-right-from-bracket" style={{ width: 18, textAlign: 'center', fontSize: 13 }} />
            <span className="sidebar-nav-text">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      <main style={{
        flex: 1, minHeight: '100vh'
      }} className="main-content">
        <header style={{
          position: 'sticky', top: 0, backgroundColor: 'var(--bg-secondary)',
          padding: '10px 20px', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', zIndex: 100, gap: 12
        }}>
          <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, overflow: 'hidden', background: '#E0D8C8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              Krop <span style={{ color: 'var(--accent-amber)' }}>Sale</span>
            </span>
          </Link>
          <div style={{ position: 'relative', flex: 1, maxWidth: 360 }} className="hide-mob">
            <i className="fas fa-search" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', fontSize: 12 }} />
            <input type="text" placeholder="Buscar..." style={{
              width: '100%', padding: '7px 12px 7px 34px', backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-color)', borderRadius: 8, color: 'var(--text-primary)', fontSize: 13
            }} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button onClick={() => router.push('/conversations')} className="icon-btn" style={{ width: 34, height: 34, fontSize: 12 }}>
              <i className="fas fa-comment-dots" />
            </button>
            <button onClick={() => router.push('/notifications')} className="icon-btn" style={{ width: 34, height: 34, fontSize: 12, position: 'relative' }}>
              <i className="fas fa-bell" />
              {unreadCount > 0 && <span className="badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
            </button>
            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '2px 8px', borderRadius: 8 }}>
                <div style={{
                  width: 34, height: 34, background: user.profileImage ? 'transparent' : 'var(--accent-amber)',
                  borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12, color: '#000',
                  overflow: 'hidden', border: '1px solid var(--border-color)'
                }}>
                  {user.profileImage ? (
                    <img src={localImg(user.profileImage)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <>{user.firstName?.[0]}{user.lastName?.[0]}</>
                  )}
                </div>
                <span style={{
                  padding: '2px 8px', borderRadius: 6, fontSize: 9, fontWeight: 600,
                  background: user.role === 'Administrador' ? 'rgba(212,168,67,0.2)' : user.role === 'Vendedor' ? 'rgba(139,125,107,0.2)' : 'rgba(74,90,106,0.2)',
                  color: user.role === 'Administrador' ? '#D4A843' : user.role === 'Vendedor' ? '#8B7D6B' : 'var(--accent-slate)'
                }}>
                  {user.role}
                </span>
              </div>
            )}
          </div>
        </header>
        <div style={{ padding: 20, paddingBottom: 80 }} className="main-pad">
          {children}
          <footer className="hide-mob" style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid var(--border-color)', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: 11, marginBottom: 6 }}>
              &copy; 2026 Krop Sale S.A. Todos los derechos reservados.
            </p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <a href="#" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Privacidad</a>
              <a href="#" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Términos</a>
              <a href="/support" style={{ color: 'var(--text-secondary)', fontSize: 11 }}>Soporte</a>
            </div>
          </footer>
        </div>
      </main>

      <nav className="bottom-nav show-mob" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-color)', zIndex: 100,
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 4px)',
        overflowX: 'auto', WebkitOverflowScrolling: 'touch', display: 'flex', flexWrap: 'nowrap'
      }}>
        {mobileNav.map(item => {
          const isActive = pathname === item.path
          return (
            <button key={item.path} onClick={() => router.push(item.path)} style={{
              flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
              padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer',
              color: isActive ? 'var(--accent-amber)' : 'var(--text-muted)',
              fontSize: 10, transition: 'color .2s ease', minWidth: 56
            }}>
              <i className={`fas ${item.icon}`} style={{ fontSize: 16 }} />
              <span>{item.label}</span>
            </button>
          )
        })}
        <button onClick={() => router.push('/settings')} style={{
          flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: 10, minWidth: 56
        }}>
          <i className="fas fa-gear" style={{ fontSize: 16 }} />
          <span>Ajustes</span>
        </button>
        {user && (
          <button onClick={() => { logout(); router.push('/login'); }} style={{
            flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '6px 10px', background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--accent-red)', fontSize: 10, minWidth: 56
          }}>
            <i className="fas fa-right-from-bracket" style={{ fontSize: 16 }} />
            <span>Salir</span>
          </button>
        )}
      </nav>
    </div>
  )
}
