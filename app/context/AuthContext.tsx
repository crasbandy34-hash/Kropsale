'use client'
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

interface User {
  id: number
  firstName: string
  lastName: string
  email: string
  role: string
  location?: string
  profileImage?: string | null
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (data: Partial<User> & { password: string }) => Promise<void>
  logout: () => void
  updateUser: (data: Partial<User>) => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>(null!)

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, maxAge: number) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`
}

function deleteCookie(name: string) {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${name}=; path=/; max-age=0; SameSite=Lax${secure}`
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedToken = getCookie('kopsale_token')
    const savedUser = getCookie('kopsale_user')
    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!token) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch('/api/auth?refresh=1', {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.token) {
            setCookie('kopsale_token', data.token, 60 * 60)
            setToken(data.token)
          }
        }
      } catch {}
    }, 50 * 60 * 1000)
    return () => clearInterval(interval)
  }, [token])

  const login = async (email: string, password: string) => {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || 'Credenciales inválidas')
    }
    const data = await res.json()
    setCookie('kopsale_token', data.token, 60 * 60)
    setCookie('kopsale_user', JSON.stringify(data.user), 60 * 60)
    setToken(data.token)
    setUser(data.user)
  }

  const register = async (data: Partial<User> & { password: string }) => {
    const res = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      throw new Error(err.error || 'Error al registrar')
    }
  }

  const logout = () => {
    deleteCookie('kopsale_token')
    deleteCookie('kopsale_user')
    setToken(null)
    setUser(null)
  }

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return prev
      const updated = { ...prev, ...data }
      setCookie('kopsale_user', JSON.stringify(updated), 60 * 60)
      return updated
    })
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, updateUser, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
