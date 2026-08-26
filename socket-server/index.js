import { createServer } from 'http'
import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'

const port = parseInt(process.env.PORT || '3001', 10)
const allowedOrigins = (process.env.ALLOWED_ORIGIN || 'http://localhost:3000').split(',')
const JWT_SECRET = process.env.JWT_SECRET

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }))
    return
  }
  res.writeHead(404)
  res.end()
})

const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ['GET', 'POST'] },
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

httpServer.listen(port, () => {
  console.log(`> Socket.IO server ready on port ${port}`)
})
