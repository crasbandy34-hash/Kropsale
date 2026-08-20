'use client'
import { useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useApi, fmtTime, initials } from '@/lib/apiClient'

export default function ConversationDetailPage() {
  const params = useParams()
  const idNum = Number(params.id)
  const { user } = useAuth()
  const api = useApi()
  const [conversations, setConversations] = useState<any[]>([])
  const [convo, setConvo] = useState<any>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [msg, setMsg] = useState('')
  const [search, setSearch] = useState('')
  const [notFound, setNotFound] = useState(false)
  const msgsRef = useRef<HTMLDivElement>(null)
  const [activeCall, setActiveCall] = useState<any>(null)
  const [callResult, setCallResult] = useState('')
  const [muted, setMuted] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (!user?.id) return
    ;(async () => {
      try {
        const [all, msgs, users, prods] = await Promise.all([
          api.get('/api/conversations').catch(() => []),
          api.get('/api/messages').catch(() => []),
          api.get('/api/users').catch(() => []),
          api.get('/api/products').catch(() => []),
        ])
        const mapConvo = (c: any) => {
          const otherId = user.role === 'Comprador' ? c.seller_id : user.role === 'Vendedor' ? c.buyer_id : (c.buyer_id === user.id ? c.seller_id : c.buyer_id)
          const other: any = users.find((u: any) => u.id === otherId)
          const convMsgs = msgs.filter((m: any) => m.conversation_id === c.id).sort((a: any, b: any) => (a.sent_at || '').localeCompare(b.sent_at || ''))
          const last = convMsgs[convMsgs.length - 1]
          const unread = convMsgs.filter((m: any) => m.sender_id !== user.id && !Number(m.is_read)).length
          const prod: any = prods.find((p: any) => p.id === c.product_id)
          const fullName = other ? `${other.firstName} ${other.lastName}` : 'Usuario'
          return {
            id: c.id,
            name: fullName,
            otherId: other ? other.id : null,
            avatar: initials(fullName),
            lastMsg: last ? last.content : (prod ? `Interés en: ${prod.title}` : 'Sin mensajes todavía'),
            time: last ? fmtTime(last.sent_at) : 'Nuevo',
            unread,
            online: false,
            role: other ? (other.role || 'Usuario') : 'Usuario',
          }
        }
        const mine = all.filter((c: any) => {
          if (user.role === 'Comprador') return c.buyer_id === user.id
          if (user.role === 'Vendedor') return c.seller_id === user.id
          return true
        })
        setConversations(mine.map(mapConvo))
        const current: any = mine.find((c: any) => c.id === idNum)
        if (!current) { setNotFound(true); return }
        setConvo(mapConvo(current))
        const convMsgs = msgs.filter((m: any) => m.conversation_id === idNum).sort((a: any, b: any) => (a.sent_at || '').localeCompare(b.sent_at || ''))
        setMessages(convMsgs.map((m: any) => ({
          id: m.id,
          from: m.sender_id === user.id ? 'me' : 'them',
          text: m.content,
          time: fmtTime(m.sent_at),
        })))
        for (const m of convMsgs) {
          if (m.sender_id !== user.id && !Number(m.is_read)) {
            await api.put(`/api/messages?id=${m.id}`, { is_read: 1 }).catch(() => {})
          }
        }
      } catch { setNotFound(true) }
    })()
  }, [idNum, user?.id])

  useEffect(() => {
    const el = msgsRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.lastMsg.toLowerCase().includes(search.toLowerCase())
  )

  async function sendMessage() {
    const text = msg.trim()
    if (!text || !user?.id) return
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    try {
      const res = await api.post('/api/messages', { conversation_id: idNum, sender_id: user.id, content: text })
      setMessages(prev => [...prev, { id: res.id || Date.now(), from: 'me', text, time: fmtTime(now) }])
      setConversations(prev => prev.map(c => c.id === idNum ? { ...c, lastMsg: text, time: fmtTime(now), unread: 0 } : c))
      setMsg('')
    } catch (e: any) {
      alert(e.message || 'Error al enviar')
    }
  }

  async function startCall(type: 'voice' | 'video') {
    if (!user?.id || !convo?.otherId) { alert('No se puede llamar a este contacto'); return }
    try {
      const res = await api.post('/api/calls', {
        conversation_id: idNum, caller_id: user.id, callee_id: convo.otherId, type,
      })
      setCallResult('')
      setActiveCall({ id: res.id, type, status: 'ringing', isCaller: true })
    } catch (e: any) {
      alert(e.message || 'Error al iniciar la llamada')
    }
  }

  useEffect(() => {
    const t = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(t)
  }, [activeCall?.status === 'ongoing'])

  useEffect(() => {
    if (!user?.id) return
    let ignore = false
    const t = setInterval(async () => {
      try {
        const msgs = await api.get('/api/messages').catch(() => [])
        if (ignore) return
        const convMs = msgs
          .filter((m: any) => m.conversation_id === idNum)
          .sort((a: any, b: any) => (a.sent_at || '').localeCompare(b.sent_at || ''))
        setMessages(convMs.map((m: any) => ({
          id: m.id,
          from: m.sender_id === user.id ? 'me' : 'them',
          text: m.content,
          time: fmtTime(m.sent_at),
        })))
        for (const m of convMs) {
          if (m.sender_id !== user.id && !Number(m.is_read)) {
            await api.put(`/api/messages?id=${m.id}`, { is_read: 1 }).catch(() => {})
          }
        }
      } catch { }
    }, 3000)
    return () => { ignore = true; clearInterval(t) }
  }, [user?.id, idNum])

  useEffect(() => {
    if (!activeCall) return
    const t = setInterval(async () => {
      try {
        const calls = await api.get(`/api/calls?conversation_id=${idNum}`).catch(() => [])
        const mine = calls.find((c: any) => c.id === activeCall.id)
        if (!mine) return
        if (mine.status === 'ongoing' && activeCall.status !== 'ongoing') {
          setElapsed(0)
          setActiveCall({ ...activeCall, status: 'ongoing' })
        } else if (mine.status === 'ended' || mine.status === 'declined') {
          setCallResult(mine.status === 'declined' ? 'Llamada no contestada' : 'Llamada finalizada')
          setActiveCall(null)
          setTimeout(() => setCallResult(''), 2000)
        }
      } catch { }
    }, 2000)
    return () => clearInterval(t)
  }, [activeCall, idNum])

  useEffect(() => {
    if (activeCall || !user?.id) return
    const t = setInterval(async () => {
      try {
        const calls = await api.get(`/api/calls?conversation_id=${idNum}`).catch(() => [])
        const inc = calls.find((c: any) => c.status === 'ringing' && c.callee_id === user.id)
        if (inc) {
          setCallResult('')
          setActiveCall({ id: inc.id, type: inc.type === 'video' ? 'video' : 'voice', status: 'ringing', isCaller: false })
        }
      } catch { }
    }, 2000)
    return () => clearInterval(t)
  }, [activeCall, idNum, user?.id])

  async function answerCall() {
    if (!activeCall || activeCall.isCaller) return
    await api.put(`/api/calls?id=${activeCall.id}&status=ongoing`, { status: 'ongoing' }).catch((e: any) => alert(e.message))
    setElapsed(0)
    setActiveCall({ ...activeCall, status: 'ongoing' })
  }

  async function declineCall() {
    if (!activeCall || activeCall.isCaller) return
    await api.put(`/api/calls?id=${activeCall.id}&status=declined`, { status: 'declined' }).catch(() => {})
    setCallResult('Llamada rechazada')
    setActiveCall(null)
    setTimeout(() => setCallResult(''), 2000)
  }

  async function cancelCall() {
    if (!activeCall) return
    await api.put(`/api/calls?id=${activeCall.id}&status=${activeCall.isCaller ? 'ended' : 'declined'}`, { status: activeCall.isCaller ? 'ended' : 'declined' }).catch(() => {})
    setCallResult(activeCall.isCaller ? 'Llamada cancelada' : 'Llamada finalizada')
    setActiveCall(null)
    setTimeout(() => setCallResult(''), 2000)
  }

  const mm = Math.floor(elapsed / 60).toString().padStart(2, '0')
  const ss = (elapsed % 60).toString().padStart(2, '0')

  if (notFound) {
    return (
      <Layout>
        <div style={{ padding: '40px 20px', textAlign: 'center', color: '#8B949E' }}>
          <i className="fas fa-comments" style={{ fontSize: 30, display: 'block', marginBottom: 12, color: 'rgba(212,168,67,0.3)' }} />
          <p style={{ marginBottom: 14 }}>Conversación no encontrada.</p>
          <Link href="/conversations" className="btn btn-sm btn-primary" style={{ background: '#D4A843', color: '#000', textDecoration: 'none' }}>Volver</Link>
        </div>
      </Layout>
    )
  }

  if (!convo) {
    return <Layout><div style={{ padding: 40, textAlign: 'center', color: '#6a7580' }}>Cargando...</div></Layout>
  }

  return (
    <Layout>
      <div className="only-mob" style={{ marginBottom: 12 }}>
        <Link href="/conversations" style={{ color: '#8B949E', fontSize: 12 }}>
          <i className="fas fa-arrow-left" style={{ marginRight: 4 }} />Volver
        </Link>
      </div>

      <div style={{ display: 'flex', gap: 14, alignItems: 'stretch' }}>

        <div className="hide-mob" style={{
          width: 280, flexShrink: 0, background: '#1e2a3a', borderRadius: 10,
          border: '1px solid var(--border-color)', overflow: 'hidden',
          display: 'flex', flexDirection: 'column', height: 'calc(100vh - 230px)'
        }}>
          <div style={{ padding: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>Conversaciones</h2>
            <div style={{ position: 'relative' }}>
              <i className="fas fa-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#6a7580', fontSize: 11 }} />
              <input type="text" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} style={{
                width: '100%', padding: '6px 10px 6px 28px', backgroundColor: 'rgba(255,255,255,0.06)',
                border: '1px solid var(--border-color)', borderRadius: 8, color: '#fff', fontSize: 12
              }} />
            </div>
          </div>
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {filtered.map(c => (
              <Link key={c.id} href={`/conversations/${c.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  background: c.id === idNum ? 'rgba(212,168,67,0.1)' : 'none',
                  cursor: 'pointer', transition: 'background .2s ease'
                }}
                  onMouseOver={(e) => e.currentTarget.style.background = c.id === idNum ? 'rgba(212,168,67,0.1)' : 'rgba(255,255,255,0.04)'}
                  onMouseOut={(e) => e.currentTarget.style.background = c.id === idNum ? 'rgba(212,168,67,0.1)' : 'none'}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: 'var(--accent-amber)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#000'
                    }}>{c.avatar}</div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                      <span style={{ fontWeight: c.id === idNum ? 700 : 500, fontSize: 12, color: '#fff' }}>{c.name}</span>
                      <span style={{ fontSize: 9, color: '#6a7580', whiteSpace: 'nowrap' }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#8B949E', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>{c.lastMsg}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div style={{
          flex: 1, minWidth: 0, background: '#1e2a3a', borderRadius: 10, border: '1px solid var(--border-color)',
          overflow: 'hidden', display: 'flex', flexDirection: 'column'
        }} className="convo-height">
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 38, height: 38, borderRadius: '50%', background: 'var(--accent-amber)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#000'
              }}>{convo.avatar}</div>
              {convo.online && <div style={{
                position: 'absolute', bottom: 0, right: 0, width: 10, height: 10,
                borderRadius: '50%', background: '#8B7D6B', border: '2px solid #1e2a3a'
              }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{convo.name}</div>
              <div style={{ fontSize: 11, color: '#8B949E' }}>{convo.online ? 'En línea' : `Mensajería · ${convo.role}`}</div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="icon-btn" style={{ width: 32, height: 32, fontSize: 11 }} onClick={() => startCall('video')} title="Videollamada">
                <i className="fas fa-video" />
              </button>
              <button className="icon-btn" style={{ width: 32, height: 32, fontSize: 11 }} onClick={() => startCall('voice')} title="Llamada de voz">
                <i className="fas fa-phone" />
              </button>
            </div>
          </div>

          <div ref={msgsRef} style={{
            flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10,
            minHeight: 0
          }} className="convo-msgs">
            {messages.length === 0 && (
              <div style={{ textAlign: 'center', color: '#6a7580', fontSize: 12, marginTop: 30 }}>
                <i className="fas fa-comment-dots" style={{ fontSize: 22, display: 'block', marginBottom: 8, color: 'rgba(212,168,67,0.3)' }} />
                Envía el primer mensaje
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} style={{
                display: 'flex', flexDirection: 'column',
                alignItems: m.from === 'me' ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  maxWidth: '80%', padding: '8px 14px', borderRadius: 12,
                  background: m.from === 'me' ? 'rgba(212,168,67,0.12)' : 'rgba(255,255,255,0.06)',
                  border: m.from === 'me' ? '1px solid rgba(212,168,67,0.2)' : '1px solid rgba(255,255,255,0.06)',
                  fontSize: 13, lineHeight: 1.5
                }}>
                  {m.text}
                </div>
                <span style={{ fontSize: 9, color: '#6a7580', marginTop: 2 }}>{m.time}</span>
              </div>
            ))}
          </div>

          <div style={{ padding: '10px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
            <input type="text" placeholder="Escribe un mensaje..." value={msg} onChange={(e) => setMsg(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage() }}
              style={{
                flex: 1, padding: '8px 12px', backgroundColor: 'rgba(255,255,255,0.06)', border: '1px solid var(--border-color)',
                borderRadius: 8, color: '#fff', fontSize: 13
              }} />
            <button onClick={sendMessage} style={{
              width: 36, height: 36, borderRadius: 8, background: '#D4A843', color: '#000',
              border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13
            }}>
              <i className="fas fa-paper-plane" />
            </button>
          </div>
        </div>
      </div>

      {activeCall && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999, background: 'rgba(15,22,34,0.97)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', padding: 24, maxWidth: 420, width: '100%' }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%', background: activeCall.type === 'video' ? 'rgba(212,168,67,0.15)' : 'var(--accent-amber)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
              fontSize: 30, color: activeCall.type === 'video' ? '#D4A843' : '#000', border: activeCall.type === 'video' ? '2px solid rgba(212,168,67,0.4)' : 'none'
            }}>
              <i className={`fas ${activeCall.type === 'video' ? 'fa-video' : 'fa-phone'}`} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>{convo.name}</div>
            <div style={{ fontSize: 13, color: '#8B949E', marginBottom: 20 }}>
              {activeCall.status === 'ongoing'
                ? `${mm}:${ss}`
                : activeCall.isCaller
                  ? 'Llamando...'
                  : `Llamada entrante${activeCall.type === 'video' ? ' de video' : ' de voz'}`
              }
            </div>
            {activeCall.status === 'ongoing' ? (
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center' }}>
                <button onClick={() => setMuted(!muted)} style={{
                  width: 52, height: 52, borderRadius: '50%', border: '1px solid var(--border-color)',
                  background: muted ? 'rgba(212,168,67,0.15)' : 'rgba(255,255,255,0.06)', color: muted ? '#D4A843' : '#fff',
                  cursor: 'pointer', fontSize: 16
                }} title={muted ? 'Reactivar micrófono' : 'Silenciar micrófono'}>
                  <i className={`fas ${muted ? 'fa-microphone-slash' : 'fa-microphone'}`} />
                </button>
                <button onClick={cancelCall} style={{
                  width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-red)',
                  border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20
                }} title="Finalizar llamada">
                  <i className="fas fa-phone-slash" />
                </button>
              </div>
            ) : activeCall.isCaller ? (
              <button onClick={cancelCall} style={{
                width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-red)',
                border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20
              }} title="Cancelar llamada">
                <i className="fas fa-phone-slash" />
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
                <button onClick={declineCall} style={{
                  width: 60, height: 60, borderRadius: '50%', background: 'var(--accent-red)',
                  border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20
                }} title="Rechazar">
                  <i className="fas fa-phone-slash" />
                </button>
                <button onClick={answerCall} style={{
                  width: 60, height: 60, borderRadius: '50%', background: '#4ade80',
                  border: 'none', color: '#000', cursor: 'pointer', fontSize: 20
                }} title="Contestar">
                  <i className="fas fa-phone" />
                </button>
              </div>
            )}
            <p style={{ marginTop: 18, fontSize: 11, color: '#6a7580' }}>
              Llamada interna Krop Sale · sin número ni SIM
            </p>
          </div>
        </div>
      )}

      {callResult && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 998, background: 'rgba(15,22,34,0.9)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none'
        }}>
          <div style={{
            background: '#1e2a3a', border: '1px solid var(--border-color)', borderRadius: 12,
            padding: '18px 26px', textAlign: 'center', fontSize: 14, color: '#E8E6E1'
          }}>
            <i className="fas fa-phone-slash" style={{ color: '#8B7D6B', fontSize: 18, display: 'block', marginBottom: 8 }} />
            {callResult}
          </div>
        </div>
      )}
    </Layout>
  )
}