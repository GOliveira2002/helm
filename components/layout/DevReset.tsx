'use client'

import { getDB, resetDBCache } from '@/lib/db'

export function DevReset() {
    if (process.env.NEXT_PUBLIC_DEV_MODE !== 'true') return null

    async function handleReset() {
        if (!confirm('Delete all data and recreate tables?')) return
        const db = await getDB()

        // Drop all tables
        await db.execute('DROP TABLE IF EXISTS requirements')
        await db.execute('DROP TABLE IF EXISTS tasks')
        await db.execute('DROP TABLE IF EXISTS sprints')
        await db.execute('DROP TABLE IF EXISTS members')
        await db.execute('DROP TABLE IF EXISTS projects')

        resetDBCache()
        window.location.reload()
    }

    return (
        <button
            onClick={handleReset}
            style={{
                position: 'fixed', bottom: '16px', right: '16px', zIndex: 9999,
                background: '#2e0a0a', border: '1px solid #e85555',
                color: '#e85555', borderRadius: '8px', padding: '6px 12px',
                fontSize: '11px', fontWeight: 500, cursor: 'pointer',
                fontFamily: 'inherit', opacity: 0.7, transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
        >
            ⚠ Reset DB
        </button>
    )
}