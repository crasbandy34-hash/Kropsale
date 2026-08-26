import { createServer } from 'http'
import { parse } from 'url'
import next from 'next'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

const dev = process.env.NODE_ENV !== 'production'
const hostname = '0.0.0.0'
const port = parseInt(process.env.PORT || '3000', 10)
const allowedOrigin = process.env.ALLOWED_ORIGIN || 'http://localhost:3000'
const JWT_SECRET = process.env.JWT_SECRET

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error handling request:', err)
      res.statusCode = 500
      res.end('Internal Server Error')
    }
  })

  const io = new Server(server, {
    cors: { origin: allowedOrigin.split(','), methods: ['GET', 'POST'] },
    transports: ['websocket', 'polling'],
  })

  if (JWT_SECRET) {
    io.use((socket, next) => {
      const token = socket.handshake.auth?.token
      if (!token) return next(new Error('Autenticación requerida'))
      try {
        jwt.verify(token, JWT_SECRET)
        next()
      } catch {
        next(new Error('Token inválido'))
      }
    })
  }

  io.on('connection', (socket) => {
    console.log('[Socket] Connected:', socket.id)

    socket.on('join-room', (conversationId) => {
      const room = `call:${conversationId}`
      socket.join(room)
      console.log(`[Socket] ${socket.id} joined room ${room}`)
    })

    socket.on('call:start', ({ conversationId, callerId, calleeId, type }) => {
      const room = `call:${conversationId}`
      console.log(`[Socket] Call started in room ${room} by ${callerId}`)
      socket.to(room).emit('call:incoming', { conversationId, callerId, calleeId, type })
    })

    socket.on('call:answer', ({ conversationId, callerId, sdp }) => {
      const room = `call:${conversationId}`
      console.log(`[Socket] Call answered in room ${room}`)
      socket.to(room).emit('call:answer', { conversationId, callerId, sdp })
    })

    socket.on('call:decline', ({ conversationId }) => {
      const room = `call:${conversationId}`
      console.log(`[Socket] Call declined in room ${room}`)
      socket.to(room).emit('call:decline', { conversationId })
    })

    socket.on('call:end', ({ conversationId }) => {
      const room = `call:${conversationId}`
      console.log(`[Socket] Call ended in room ${room}`)
      socket.to(room).emit('call:end', { conversationId })
    })

    socket.on('webrtc:offer', ({ conversationId, sdp }) => {
      const room = `call:${conversationId}`
      socket.to(room).emit('webrtc:offer', { sdp })
    })

    socket.on('webrtc:answer', ({ conversationId, sdp }) => {
      const room = `call:${conversationId}`
      socket.to(room).emit('webrtc:answer', { sdp })
    })

    socket.on('webrtc:ice-candidate', ({ conversationId, candidate }) => {
      const room = `call:${conversationId}`
      socket.to(room).emit('webrtc:ice-candidate', { candidate })
    })

    socket.on('disconnect', () => {
      console.log('[Socket] Disconnected:', socket.id)
    })
  })

  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`)
  })
})
