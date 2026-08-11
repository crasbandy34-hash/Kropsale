'use client'
import Link from 'next/link'
import { useRef, useEffect } from 'react'

export default function Home() {
  const carRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = carRef.current
    if (!el) return
    const alignImg = () => {
      const nav = document.querySelector('.landing-header') as HTMLElement | null
      const hero = document.querySelector('.landing-hero') as HTMLElement | null
      const imgs = document.querySelectorAll('.landing-hero-img') as unknown as HTMLElement[]
      if (nav && hero && imgs.length) {
        const navTop = nav.offsetTop + nav.offsetHeight
        const h = hero.offsetTop + hero.offsetHeight - navTop + 48
        imgs.forEach(img => {
          img.style.top = (navTop - 1) + 'px'
          img.style.height = Math.max(h, 260) + 'px'
        })
      }
    }
    alignImg()
    window.addEventListener('resize', alignImg)
    const imgs = document.querySelectorAll('.landing-hero-img') as unknown as HTMLElement[]
    let slide = 0
    imgs.forEach((img, i) => { img.style.opacity = i === 0 ? '1' : '0' })
    const slideInt = setInterval(() => {
      if (!imgs.length) return
      const next = (slide + 1) % imgs.length
      imgs[slide].style.opacity = '0'
      imgs[next].style.opacity = '1'
      slide = next
    }, 2600)
    let paused = false
    const interval = setInterval(() => {
      if (paused) return
      const maxScroll = el.scrollWidth - el.clientWidth
      if (el.scrollLeft >= maxScroll - 10) {
        el.scrollTo({ left: 0, behavior: 'smooth' })
      } else {
        el.scrollBy({ left: el.clientWidth, behavior: 'smooth' })
      }
    }, 3500)
    el.addEventListener('mouseenter', () => { paused = true })
    el.addEventListener('mouseleave', () => { paused = false })
    return () => { clearInterval(interval); clearInterval(slideInt); window.removeEventListener('resize', alignImg) }
  }, [])
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      <img className="landing-hero-img" src="/img/hero-field.jpg" alt="" />
      <img className="landing-hero-img" src="/img/hero-field2.jpg" alt="" />
      <img className="landing-hero-img" src="/img/hero-field3.jpg" alt="" />
      <style>{`
        .landing-features { display: flex !important; overflow-x: auto !important; gap: 14px !important; scroll-snap-type: x mandatory !important; -webkit-overflow-scrolling: touch !important; padding-bottom: 8px !important; }
        .landing-features > div { min-width: 220px; scroll-snap-align: start; flex-shrink: 0; }
        .landing-features::-webkit-scrollbar { height: 4px; }
        .landing-features::-webkit-scrollbar-track { background: transparent; }
        .landing-features::-webkit-scrollbar-thumb { background: var(--border-color); border-radius: 4px; }
        .landing-hero-img { position: absolute !important; right: -12px !important; top: 66px !important; width: min(74vw, 1200px) !important; height: clamp(420px, 78vh, 860px) !important; object-fit: cover !important; object-position: right center !important; opacity: 0; z-index: 0 !important; pointer-events: none !important; transition: opacity 1.2s ease !important; -webkit-mask-image: linear-gradient(137deg, transparent 0%, transparent 38%, black 100%) !important; mask-image: linear-gradient(137deg, transparent 0%, transparent 38%, black 100%) !important; }
        .landing-hero-content { position: relative !important; z-index: 1 !important; }
        @media (max-width: 768px) {
          .landing-header { padding: 12px 16px !important; }
          .landing-hero h1 { font-size: 24px !important; }
          .landing-hero p { font-size: 13px !important; }
          .landing-hero-btns { flex-direction: column !important; align-items: stretch !important; }
          .landing-hero-btns a { width: 100%; }
          .landing-hero-btns button { width: 100% !important; justify-content: center !important; }
          .landing-main { padding: 28px 16px !important; }
          .landing-section { margin-bottom: 36px !important; }
          .landing-features > div { min-width: calc(100vw - 32px) !important; padding: 16px 14px !important; flex: 0 0 calc(100vw - 32px) !important; }
          .landing-features > div h3 { font-size: 13px !important; }
          .landing-features > div p { font-size: 11px !important; }
          .landing-cta { padding: 24px 16px !important; }
          .landing-cta h2 { font-size: 17px !important; }
          .landing-footer { padding: 16px !important; }
          .landing-hero-img { width: 96% !important; right: -20px !important; top: 54px !important; height: min(56vh, 460px) !important; height: min(56svh, 460px) !important; }
        }
        @media (min-width: 769px) {
          .landing-auth-btns { display: flex !important; }
        }
      `}</style>
      <header className="landing-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 28px', borderBottom: '1px solid var(--border-color)' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, overflow: 'hidden', background: '#E0D8C8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <span className="landing-logo-text" style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-primary)' }}>
            Krop <span style={{ color: 'var(--accent-amber)' }}>Sale</span>
          </span>
        </Link>
        <div style={{ display: 'flex', gap: 8 }}>
          <Link href="/login">
            <button className="btn btn-sm btn-secondary">Iniciar Sesión</button>
          </Link>
          <Link href="/register">
            <button className="btn btn-sm btn-primary">Registrarse</button>
          </Link>
        </div>
      </header>

      <main className="landing-main" style={{ flex: 1, maxWidth: 960, margin: '0 auto', padding: '48px 24px', width: '100%' }}>
        <section className="landing-hero landing-section" style={{ textAlign: 'center', marginBottom: 56 }}>
          <div className="landing-hero-content">
          <div style={{ width: 72, height: 72, borderRadius: 18, overflow: 'hidden', margin: '0 auto 20px', background: '#E0D8C8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 12, lineHeight: 1.2 }}>
            La red agrícola más{' '}
            <span style={{ color: 'var(--accent-amber)' }}>inteligente</span>
            <br />del país
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 520, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Conectamos agricultores, compradores y administradores en una sola plataforma.
            Comercializa productos agrícolas de forma directa, segura y eficiente.
          </p>
          <div className="landing-hero-btns" style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register">
              <button className="btn btn-primary" style={{ padding: '12px 28px', fontSize: 15 }}>
                <i className="fas fa-user-plus" /> Comenzar ahora
              </button>
            </Link>
            <Link href="/login">
              <button className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: 15 }}>
                <i className="fas fa-right-to-bracket" /> Ya tengo cuenta
              </button>
            </Link>
          </div>
          </div>
        </section>

        <section className="landing-section" style={{ marginBottom: 48 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, textAlign: 'center', marginBottom: 28, color: 'var(--text-primary)' }}>
            ¿Qué ofrecemos?
          </h2>
          <div ref={carRef} className="landing-features">
            {[
              { icon: 'fa-store', title: 'Para Vendedores', desc: 'Publica tus productos, gestiona inventario, recibe pedidos y haz crecer tu negocio agrícola.', color: 'var(--accent-amber)' },
              { icon: 'fa-shopping-basket', title: 'Para Compradores', desc: 'Encuentra productos frescos directo del campo, compara precios y compra de forma segura.', color: 'var(--accent-stone)' },
              { icon: 'fa-shield-halved', title: 'Para Administradores', desc: 'Gestiona usuarios, categorías, reportes y mantén la plataforma funcionando sin problemas.', color: 'var(--accent-slate)' },
              { icon: 'fa-comments', title: 'Mensajería Directa', desc: 'Comunícate en tiempo real con vendedores y compradores sin salir de la plataforma.', color: 'var(--accent-sage)' },
              { icon: 'fa-star', title: 'Sistema de Reseñas', desc: 'Califica productos y vendedores. La transparencia genera confianza en cada transacción.', color: 'var(--accent-amber)' },
              { icon: 'fa-chart-line', title: 'Reportes y Estadísticas', desc: 'Accede a datos clave sobre ventas, inventario y rendimiento para tomar mejores decisiones.', color: 'var(--accent-stone)' },
            ].map(f => (
              <div key={f.title} style={{ background: 'var(--bg-card)', borderRadius: 12, padding: '20px 18px', border: '1px solid var(--border-color)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <i className={'fas ' + f.icon} style={{ color: f.color, fontSize: 16 }} />
                </div>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{f.title}</h3>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="landing-cta" style={{ background: 'var(--bg-card)', borderRadius: 14, padding: '32px 24px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Únete a Krop Sale</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 20, maxWidth: 400, margin: '0 auto 20px' }}>
            Ya sea que quieras vender, comprar o administrar, tenemos todo lo que necesitas.
          </p>
          <Link href="/register">
            <button className="btn btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}>
              <i className="fas fa-rocket" /> Crear cuenta gratis
            </button>
          </Link>
        </section>
      </main>

      <footer className="landing-footer hide-mob" style={{ borderTop: '1px solid var(--border-color)', padding: '20px 28px', textAlign: 'center' }}>
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
  )
}