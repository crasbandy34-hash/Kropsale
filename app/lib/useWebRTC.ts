'use client'
import { useRef, useCallback, useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

const DEFAULT_ICE_SERVERS: RTCIceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

function getSocketUrl(): string {
  if (typeof window === 'undefined') return ''
  return process.env.NEXT_PUBLIC_SOCKET_URL || window.location.origin
}

function getTokenFromCookie(): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )kopsale_token=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function getIceServers(): RTCIceServer[] {
  if (typeof window === 'undefined') return DEFAULT_ICE_SERVERS
  const envServers = (window as any).__NEXT_DATA__?.props?.pageProps?.iceServers
  if (envServers) {
    try { return JSON.parse(envServers) } catch {}
  }
  return DEFAULT_ICE_SERVERS
}

interface CallCallbacks {
  onIncomingCall?: (data: { conversationId: number; callerId: number; calleeId: number; type: 'voice' | 'video' }) => void
  onCallAnswered?: (data: { conversationId: number; callerId: number }) => void
  onCallDeclined?: (data: { conversationId: number }) => void
  onCallEnded?: (data: { conversationId: number }) => void
}

export function useWebRTC(callbacks?: CallCallbacks) {
  const socketRef = useRef<Socket | null>(null)
  const pcRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null)
  const callTypeRef = useRef<'voice' | 'video'>('voice')
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null)
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([])
  const conversationIdRef = useRef<number>(0)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [mediaReady, setMediaReady] = useState(false)

  useEffect(() => {
    const url = getSocketUrl()
    const token = getTokenFromCookie()
    const socket = io(url, {
      transports: ['websocket', 'polling'],
      auth: token ? { token } : undefined,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
    })
    socketRef.current = socket

    socket.on('call:incoming', (data) => callbacks?.onIncomingCall?.(data))
    socket.on('call:answer', (data) => callbacks?.onCallAnswered?.(data))
    socket.on('call:decline', (data) => callbacks?.onCallDeclined?.(data))
    socket.on('call:end', (data) => callbacks?.onCallEnded?.(data))

    socket.on('webrtc:offer', async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current
      if (!pc) {
        pendingOfferRef.current = sdp
        return
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
        pendingCandidatesRef.current.forEach(async (c) => {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
        })
        pendingCandidatesRef.current = []
      } catch (e) { console.error('[WebRTC] Error setting remote offer:', e) }
    })

    socket.on('webrtc:answer', async ({ sdp }: { sdp: RTCSessionDescriptionInit }) => {
      const pc = pcRef.current
      if (!pc) return
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
      } catch (e) { console.error('[WebRTC] Error setting remote answer:', e) }
    })

    socket.on('webrtc:ice-candidate', async ({ candidate }: { candidate: RTCIceCandidateInit }) => {
      const pc = pcRef.current
      if (!candidate) return
      if (!pc) {
        pendingCandidatesRef.current.push(candidate)
        return
      }
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate))
      } catch (e) { console.error('[WebRTC] Error adding ICE candidate:', e) }
    })

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!socketRef.current) return
    const cb = callbacks
    socketRef.current.off('call:incoming')
    socketRef.current.off('call:answer')
    socketRef.current.off('call:decline')
    socketRef.current.off('call:end')
    socketRef.current.on('call:incoming', (data) => cb?.onIncomingCall?.(data))
    socketRef.current.on('call:answer', (data) => cb?.onCallAnswered?.(data))
    socketRef.current.on('call:decline', (data) => cb?.onCallDeclined?.(data))
    socketRef.current.on('call:end', (data) => cb?.onCallEnded?.(data))
  }, [callbacks?.onIncomingCall, callbacks?.onCallAnswered, callbacks?.onCallDeclined, callbacks?.onCallEnded])

  const joinRoom = useCallback((conversationId: number) => {
    conversationIdRef.current = conversationId
    socketRef.current?.emit('join-room', conversationId)
  }, [])

  const createPeerConnection = useCallback((conversationId: number): RTCPeerConnection => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }

    const pc = new RTCPeerConnection({ iceServers: getIceServers() })

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socketRef.current?.emit('webrtc:ice-candidate', { conversationId, candidate: e.candidate })
      }
    }

    pc.ontrack = (e) => {
      remoteStreamRef.current = e.streams[0] || null
      setRemoteStream(e.streams[0] || null)
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!)
      })
    }

    pcRef.current = pc
    return pc
  }, [])

  const initMedia = useCallback(async (type: 'voice' | 'video'): Promise<boolean> => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
      }

      const constraints: MediaStreamConstraints = {
        audio: true,
        video: type === 'video' ? { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' } : false,
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      localStreamRef.current = stream
      callTypeRef.current = type
      setLocalStream(stream)
      setMediaReady(true)
      return true
    } catch (e) {
      console.error('[WebRTC] getUserMedia error:', e)
      return false
    }
  }, [])

  const startCall = useCallback(async (conversationId: number, callerId: number, calleeId: number, type: 'voice' | 'video') => {
    pendingOfferRef.current = null
    pendingCandidatesRef.current = []

    const gotMedia = await initMedia(type)
    if (!gotMedia) throw new Error('No se pudo acceder al micrófono' + (type === 'video' ? '/cámara' : ''))

    joinRoom(conversationId)
    const pc = createPeerConnection(conversationId)
    callTypeRef.current = type

    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)

    socketRef.current?.emit('call:start', { conversationId, callerId, calleeId, type })
    socketRef.current?.emit('webrtc:offer', { conversationId, sdp: pc.localDescription })
  }, [initMedia, joinRoom, createPeerConnection])

  const answerCall = useCallback(async (conversationId: number, callerId: number, callType: 'voice' | 'video') => {
    pendingCandidatesRef.current = []

    const gotMedia = await initMedia(callType)
    if (!gotMedia) throw new Error('No se pudo acceder al micrófono' + (callType === 'video' ? '/cámara' : ''))

    joinRoom(conversationId)
    const pc = createPeerConnection(conversationId)
    callTypeRef.current = callType

    if (pendingOfferRef.current) {
      await pc.setRemoteDescription(new RTCSessionDescription(pendingOfferRef.current))
      pendingOfferRef.current = null
      pendingCandidatesRef.current.forEach(async (c) => {
        try { await pc.addIceCandidate(new RTCIceCandidate(c)) } catch {}
      })
      pendingCandidatesRef.current = []
    }

    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    socketRef.current?.emit('webrtc:answer', { conversationId, sdp: pc.localDescription })
    socketRef.current?.emit('call:answer', { conversationId, callerId })
  }, [initMedia, joinRoom, createPeerConnection])

  const declineCall = useCallback((conversationId: number) => {
    socketRef.current?.emit('call:decline', { conversationId })
  }, [])

  const endCall = useCallback((conversationId: number) => {
    socketRef.current?.emit('call:end', { conversationId })
    cleanup()
  }, [])

  const cleanup = useCallback(() => {
    if (pcRef.current) {
      pcRef.current.close()
      pcRef.current = null
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop())
      localStreamRef.current = null
    }
    remoteStreamRef.current = null
    pendingOfferRef.current = null
    pendingCandidatesRef.current = []
    setLocalStream(null)
    setRemoteStream(null)
    setMediaReady(false)
  }, [])

  const toggleMute = useCallback((): boolean => {
    if (!localStreamRef.current) return false
    const audioTrack = localStreamRef.current.getAudioTracks()[0]
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled
      return !audioTrack.enabled
    }
    return false
  }, [])

  return {
    localStream,
    remoteStream,
    mediaReady,
    joinRoom,
    startCall,
    answerCall,
    declineCall,
    endCall,
    toggleMute,
    cleanup,
  }
}
