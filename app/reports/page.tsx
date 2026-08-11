'use client'
import { useState, useEffect } from 'react'
import Layout from '@/components/Layout'
import { useApi, fmtDate } from '@/lib/apiClient'

export default function ReportsPage() {
  const api = useApi()
  const [period, setPeriod] = useState('monthly')
  const [loaded, setLoaded] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [monthlySales, setMonthlySales] = useState<any[]>([])
  const [topCategories, setTopCategories] = useState<any[]>([])

  useEffect(() => {
    ;(async () => {
      try {
        const [users, products, sales, ratings, categories] = await Promise.all([
          api.get('/api/users').catch(() => []),
          api.get('/api/products').catch(() => []),
          api.get('/api/sales').catch(() => []),
          api.get('/api/ratings').catch(() => []),
          api.get('/api/categories').catch(() => []),
        ])
        const price = (s: any) => {
          const p: any = products.find((x: any) => x.id === s.product_id)
          return p ? Number(p.price) * Number(s.quantity || 1) : 0
        }
        const total = sales.reduce((acc: number, s: any) => acc + price(s), 0)
        setReports([
          { label: 'Ventas del Mes', value: `$${Math.round(total).toLocaleString()}`, change: `${sales.length} pedido(s)`, color: '#8B7D6B', icon: 'fa-chart-line' },
          { label: 'Usuarios', value: users.length.toLocaleString(), change: 'registrados', color: '#4a5a6a', icon: 'fa-users' },
          { label: 'Productos', value: products.length.toLocaleString(), change: 'publicados', color: '#D4A843', icon: 'fa-boxes' },
          { label: 'Pedidos', value: sales.length.toLocaleString(), change: 'en total', color: '#a78bfa', icon: 'fa-check-circle' },
        ])
        const months = Array(7).fill(0).map(() => 0)
        sales.forEach((s: any) => {
          const m = new Date(String(s.created_at || '').includes('T') ? s.created_at : String(s.created_at || '').replace(' ', 'T') + 'Z').getMonth()
          if (m >= 0 && m < 7) months[m] += price(s)
        })
        setMonthlySales(['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul'].map((mm, i) => ({ month: mm, amount: Math.round(months[i]) })))
        const byCat: Record<number, { revenue: number; count: number }> = {}
        sales.forEach((s: any) => {
          const p: any = products.find((x: any) => x.id === s.product_id)
          if (!p) return
          if (!byCat[p.category_id]) byCat[p.category_id] = { revenue: 0, count: 0 }
          byCat[p.category_id].revenue += price(s)
          byCat[p.category_id].count += 1
        })
        const catRows = Object.entries(byCat).map(([cid, v]) => {
          const c: any = categories.find((x: any) => x.id === Number(cid))
          const totalCat = sales.reduce((a: number, s: any) => a + price(s), 0) || 1
          return {
            name: c ? c.name : 'General',
            sales: v.count,
            revenue: `$${v.revenue.toFixed(2)}`,
            growth: `+${((v.revenue / totalCat) * 100).toFixed(0)}%`,
          }
        }).sort((a, b) => parseFloat(b.revenue.replace('$', '')) - parseFloat(a.revenue.replace('$', '')))
        setTopCategories(catRows)
      } catch {
        setReports([])
        setMonthlySales([])
        setTopCategories([])
      }
      setLoaded(true)
    })()
  }, [])

  function exportCsv() {
    const sep = ';'
    const lines: string[] = ['Reporte Krop Sale;Generado;' + new Date().toLocaleString() + '']
    lines.push('')
    lines.push('Indicador;Valor;Detalle')
    reports.forEach(r => lines.push(`${r.label}${sep}${r.value}${sep}${r.change}`))
    lines.push('')
    lines.push('Mes;Ventas ($)')
    monthlySales.forEach(m => lines.push(`${m.month}${sep}${m.amount}`))
    lines.push('')
    lines.push('Categoría;Pedidos;Ingresos;Participación')
    topCategories.forEach(c => lines.push(`${c.name}${sep}${c.sales}${sep}${c.revenue}${sep}${c.growth}`))
    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `reporte-kopsale-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  return (
    <Layout>
      <div style={{
        background: 'var(--bg-card-alt)',
        borderRadius: 14, padding: '16px 18px', marginBottom: 14
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 19, fontWeight: 700, marginBottom: 4 }}>Reportes</h1>
            <p style={{ color: '#8B949E', fontSize: 12 }}>Estadísticas de la plataforma.</p>
          </div>
          <button className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000' }} onClick={exportCsv}>
            <i className="fas fa-download" /> Exportar
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto' }}>
        {['daily', 'weekly', 'monthly', 'yearly'].map(p => (
          <button key={p} onClick={() => setPeriod(p)} style={{
            padding: '4px 12px', borderRadius: 20, fontSize: 11, border: '1px solid var(--border-color)', whiteSpace: 'nowrap',
            background: period === p ? '#D4A843' : 'transparent', color: period === p ? '#000' : '#8B949E', cursor: 'pointer', fontWeight: period === p ? 600 : 400
          }}>{p === 'daily' ? 'Diario' : p === 'weekly' ? 'Semanal' : p === 'monthly' ? 'Mensual' : 'Anual'}</button>
        ))}
      </div>

      <div className="grid-4">
        {reports.map(r => (
          <div key={r.label} style={{ background: '#1e2a3a', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 11, color: '#8B949E' }}>{r.label}</span>
              <i className={`fas ${r.icon}`} style={{ color: r.color, fontSize: 14 }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 2, fontFamily: 'Inter' }}>{r.value}</div>
            <div style={{ fontSize: 10, color: '#8B949E' }}>{r.change}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 14, marginTop: 14 }}>
        <div style={{ background: '#1e2a3a', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Ventas Mensuales</h3>
          {!loaded ? (
            <div style={{ color: '#6a7580', fontSize: 12, padding: 20, textAlign: 'center' }}>Cargando...</div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 150, padding: '8px 0' }}>
              {monthlySales.map(m => {
                const maxAmount = Math.max(...monthlySales.map(x => x.amount), 1)
                const height = (m.amount / maxAmount) * 100
                return (
                  <div key={m.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 9, color: '#6a7580', fontFamily: 'Inter' }}>${(m.amount / 1000).toFixed(1)}k</span>
                    <div style={{ width: '100%', height: height + '%', borderRadius: '4px 4px 0 0', background: 'var(--accent-amber)', minHeight: 2 }} />
                    <span style={{ fontSize: 10, color: '#8B949E' }}>{m.month}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={{ background: '#1e2a3a', borderRadius: 10, padding: '16px 18px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Categorías Top</h3>
          {topCategories.length === 0 ? (
            <div style={{ fontSize: 12, color: '#6a7580', padding: 20, textAlign: 'center' }}>Aún no hay ventas por categoría.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topCategories.map(c => (
                <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', background: 'rgba(0,0,0,0.15)', borderRadius: 6 }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500 }}>{c.name}</div>
                    <div style={{ fontSize: 10, color: '#6a7580', fontFamily: 'Inter' }}>{c.sales} pedido(s)</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#D4A843', fontFamily: 'Inter' }}>{c.revenue}</div>
                    <div style={{ fontSize: 10, color: '#8B949E', fontFamily: 'Inter' }}>{c.growth} participación</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}