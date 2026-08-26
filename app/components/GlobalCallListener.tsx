'use client'
import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useApi } from '@/lib/apiClient'
import { io, Socket } from 'socket.io-client'

export default function GlobalCallListener({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { user } = useAuth() || { user: null }
  const api = useApi()
  const socketRef = useRef<Socket | null>(null)
  const [incomingCall, setIncomingCall] = useState<any>(null)
  const [callerName, setCallerName] = useState('')
  const [callerRole, setCallerRole] = useState('')
  const incomingCallRef = useRef<any>(null)

  useEffect(() => {
    incomingCallRef.current = incomingCall
  }, [incomingCall])

  useEffect(() => {
    if (!user?.id) return

    const url = process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
    const tokenMatch = document.cookie.match(new RegExp('(^| )kopsale_token=([^;]+)'))
    const token = tokenMatch ? decodeURIComponent(tokenMatch[2]) : null
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
    })
    socketRef.current = socket

    let pollTimer: any = null
    let mounted = true

    ;(async () => {
      try {
        const [convs, users] = await Promise.all([
          api.get('/api/conversations').catch(() => []),
          api.get('/api/users').catch(() => []),
        ])

        if (!mounted) return

        const myConvos = convs.filter((c: any) =>
          c.buyer_id === user.id || c.seller_id === user.id
        )

        myConvos.forEach((c: any) => {
          socket.emit('join-room', c.id)
        })

        socket.on('call:incoming', (data: { conversationId: number; callerId: number; calleeId: number; type: 'voice' | 'video' }) => {
          if (data.calleeId !== user.id) return
          if (pathname === `/conversations/${data.conversationId}`) return
          if (incomingCallRef.current) return
          const caller: any = users.find((u: any) => u.id === data.callerId)
          setCallerName(caller ? `${caller.firstName} ${caller.lastName}` : 'Alguien')
          setCallerRole(caller ? caller.role : '')
          setIncomingCall({ ...data, dbCallId: null })
        })

        socket.on('call:decline', () => {
          setIncomingCall(null)
        })

        socket.on('call:end', () => {
          setIncomingCall(null)
        })

        socket.on('call:answer', () => {
          setIncomingCall(null)
        })

        pollTimer = setInterval(async () => {
          try {
            const calls = await api.get('/api/calls?active=1').catch(() => [])
            const incoming = calls.find((c: any) =>
              c.status === 'ringing' && c.callee_id === user.id
            )
            if (!mounted) return
            if (!incoming) {
              if (incomingCallRef.current) setIncomingCall(null)
              return
            }
            if (pathname === `/conversations/${incoming.conversation_id}`) return
            if (incomingCallRef.current) return

            const caller: any = users.find((u: any) => u.id === incoming.caller_id)
            setCallerName(caller ? `${caller.firstName} ${caller.lastName}` : 'Alguien')
            setCallerRole(caller ? caller.role : '')
            setIncomingCall({
              conversationId: incoming.conversation_id,
              callerId: incoming.caller_id,
              calleeId: incoming.callee_id,
              type: incoming.type === 'video' ? 'video' : 'voice',
              dbCallId: incoming.id,
            })
          } catch {}
        }, 2000)
      } catch {}
    })()

    return () => {
      mounted = false
      if (pollTimer) clearInterval(pollTimer)
      socket.disconnect()
      socketRef.current = null
    }
  }, [user?.id])

  const declineCall = useCallback(async () => {
    const call = incomingCallRef.current
    if (!call) return
    setIncomingCall(null)
    if (call.dbCallId) {
      await api.put(`/api/calls?id=${call.dbCallId}`, { status: 'declined' }).catch(() => {})
    }
  }, [])

  const answerCall = useCallback(() => {
    const call = incomingCallRef.current
    if (!call) return
    setIncomingCall(null)
    router.push(`/conversations/${call.conversationId}`)
  }, [router])

  return (
    <>
      {children}

      {incomingCall && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          background: 'rgba(15,22,34,0.95)',
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ textAlign: 'center', padding: 24, maxWidth: 380, width: '100%' }}>
            <div style={{
              width: 90, height: 90, borderRadius: '50%',
              background: incomingCall.type === 'video' ? 'rgba(212,168,67,0.15)' : 'var(--accent-amber)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 30,
              color: incomingCall.type === 'video' ? '#D4A843' : '#000',
              border: incomingCall.type === 'video' ? '2px solid rgba(212,168,67,0.4)' : 'none',
              animation: 'pulse 1.5s infinite'
            }}>
              <i className={`fas ${incomingCall.type === 'video' ? 'fa-video' : 'fa-phone'}`} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{callerName}</div>
            <div style={{ fontSize: 12, color: '#8B949E', marginBottom: 4 }}>
              {callerRole}
            </div>
            <div style={{ fontSize: 13, color: '#D4A843', marginBottom: 28 }}>
              Llamada entrante de {incomingCall.type === 'video' ? 'video' : 'voz'}...
            </div>
            <div style={{ display: 'flex', gap: 24, justifyContent: 'center' }}>
              <button onClick={declineCall} style={{
                width: 60, height: 60, borderRadius: '50%', background: '#8B4040',
                border: 'none', color: '#fff', cursor: 'pointer', fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }} title="Rechazar">
                <i className="fas fa-phone-slash" />
              </button>
              <button onClick={answerCall} style={{
                width: 60, height: 60, borderRadius: '50%', background: '#4ade80',
                border: 'none', color: '#000', cursor: 'pointer', fontSize: 20,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }} title="Contestar">
                <i className="fas fa-phone" />
              </button>
            </div>
            <p style={{ marginTop: 20, fontSize: 11, color: '#6a7580' }}>
              Toca contestar para abrir la conversación
            </p>
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.08); opacity: 0.8; }
            }
          `}</style>
        </div>
      )}
    </>
  )
}
