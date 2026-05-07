'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { href: '/', label: 'Dashboard', icon: '⊞' },
  { href: '/projects', label: 'Projects', icon: '◈' },
  { href: '/sprints', label: 'Sprints', icon: '◎' },
  { href: '/requirements', label: 'Requirements', icon: '⌗' },
  { href: '/board', label: 'Kanban', icon: '▦' },
  { href: '/gantt', label: 'Gantt', icon: '▬' },
  { href: '/analytics', label: 'Analytics', icon: '∿' },
]

const BOTTOM_NAV = [
  { href: '/settings', label: 'Settings', icon: '⊙' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        minHeight: '100vh',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        zIndex: 40,
      }}
    >
      {/* Logo */}
      <div
        style={{
          height: 'var(--topbar-height)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 20px',
          borderBottom: '1px solid var(--border)',
          gap: 10,
        }}
      >
        <span style={{ fontSize: 20 }}>⚓</span>
        <span style={{ fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          HELM
        </span>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--bg-raised)' : 'transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)'
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: 15, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
              {active && (
                <span
                  style={{
                    marginLeft: 'auto',
                    width: 4,
                    height: 4,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                  }}
                />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Bottom nav */}
      <div style={{ padding: '12px 8px', borderTop: '1px solid var(--border)' }}>
        {BOTTOM_NAV.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '7px 12px',
                borderRadius: 6,
                textDecoration: 'none',
                fontSize: 13,
                fontWeight: active ? 500 : 400,
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: active ? 'var(--bg-raised)' : 'transparent',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg-raised)'
              }}
              onMouseLeave={(e) => {
                if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'
              }}
            >
              <span style={{ fontSize: 15, opacity: active ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
