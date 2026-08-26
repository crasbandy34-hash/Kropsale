import { AuthProvider } from '@/context/AuthContext'
import GlobalCallListener from '@/components/GlobalCallListener'
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Krop Sale',
  description: 'Marketplace agrícola Krop Sale',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <GlobalCallListener>{children}</GlobalCallListener>
        </AuthProvider>
      </body>
    </html>
  )
}
