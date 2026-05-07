import type { Metadata } from 'next'
import './globals.css'
import { ThemeProvider } from '../components/providers/ThemeProvider'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { DevReset } from '../components/layout/DevReset'

export const metadata: Metadata = {
  title: 'HELM — PM Command Center',
  description: 'Open-source agile project management. Runs entirely in your browser.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <DevReset />
          <div style={{ display: 'flex', minHeight: '100vh' }}>

            {/* Sidebar */}
            <Sidebar />

            {/* Main area */}
            <div
              style={{
                marginLeft: 'var(--sidebar-width)',
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
                background: 'var(--bg-base)',
              }}
            >
              <Topbar />

              <main style={{ flex: 1, padding: '32px 32px' }}>
                {children}
              </main>
            </div>

          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
