'use client'

import { useEffect, useState } from 'react'
import { getRequirements, createRequirement, updateRequirement, deleteRequirement, requirementToTask, Requirement, Moscow } from '@/lib/requirements'
import { getProjects, Project } from '@/lib/projects'
import { getSprints, Sprint } from '@/lib/sprints'

const MOSCOW_STYLES: Record<Moscow, { label: string; color: string; bg: string }> = {
    must: { label: 'Must', color: '#ef4444', bg: '#2e0a0a' },
    should: { label: 'Should', color: '#f59e0b', bg: '#2e1f00' },
    could: { label: 'Could', color: '#0ea5e9', bg: '#0a2233' },
    wont: { label: "Won't", color: '#5a5752', bg: 'var(--bg-overlay)' },
}

export default function RequirementsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [sprints, setSprints] = useState<Sprint[]>([])
    const [requirements, setRequirements] = useState<Requirement[]>([])
    const [selectedProject, setSelectedProject] = useState('')
    const [loading, setLoading] = useState(true)
    const [newName, setNewName] = useState('')
    const [converting, setConverting] = useState<string | null>(null)
    const [error, setError] = useState('')

    useEffect(() => {
        getProjects().then(async p => {
            setProjects(p)
            if (p.length === 0) { setLoading(false); return }
            const pid = p[0].id
            setSelectedProject(pid)
            const [reqs, sprs] = await Promise.all([getRequirements(pid), getSprints(pid)])
            setRequirements(reqs)
            setSprints(sprs)
            setLoading(false)
        })
    }, [])

    async function handleProjectChange(pid: string) {
        setSelectedProject(pid)
        const [reqs, sprs] = await Promise.all([getRequirements(pid), getSprints(pid)])
        setRequirements(reqs)
        setSprints(sprs)
    }

    async function handleCreate() {
        if (!newName.trim()) return
        const req = await createRequirement(selectedProject, newName.trim())
        setRequirements(prev => [...prev, req])
        setNewName('')
    }

    async function handleUpdate(id: string, fields: Partial<Pick<Requirement, 'name' | 'hours' | 'moscow' | 'sprint_id'>>) {
        await updateRequirement(id, fields)
        setRequirements(prev => prev.map(r => r.id === id ? { ...r, ...fields } : r))
    }

    async function handleDelete(id: string) {
        await deleteRequirement(id)
        setRequirements(prev => prev.filter(r => r.id !== id))
    }

    async function handleConvert(req: Requirement) {
        setError('')
        setConverting(req.id)
        try {
            await requirementToTask(req)
            setRequirements(prev => prev.map(r => r.id === req.id ? { ...r, converted_to_task: true } : r))
        } catch (e) {
            if (e instanceof Error) setError(e.message)
            else setError('Failed to convert.')
        } finally {
            setConverting(null)
        }
    }

    const inputStyle: React.CSSProperties = {
        background: 'var(--bg-raised)', border: '1px solid var(--border)',
        borderRadius: '6px', padding: '6px 8px', fontSize: '12px',
        color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
    }

    // Group by MoSCoW
    const grouped: Record<Moscow, Requirement[]> = {
        must: requirements.filter(r => r.moscow === 'must'),
        should: requirements.filter(r => r.moscow === 'should'),
        could: requirements.filter(r => r.moscow === 'could'),
        wont: requirements.filter(r => r.moscow === 'wont'),
    }

    const totalHours = requirements.reduce((s, r) => s + Number(r.hours), 0)
    const mustHours = grouped.must.reduce((s, r) => s + Number(r.hours), 0)

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>

    if (projects.length === 0) return (
        <div style={{ padding: '2rem 2.5rem' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Requirements</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create a project first.</p>
        </div>
    )

    return (
        <div style={{ padding: '2rem 2.5rem', maxWidth: '1000px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Requirements</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {requirements.length} requirements · {totalHours}h total · {mustHours}h must-have
                    </p>
                </div>
            </div>

            {/* Project selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {projects.map(p => (
                    <button key={p.id} onClick={() => handleProjectChange(p.id)} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '5px 12px', borderRadius: '999px', fontSize: '12px',
                        fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                        border: selectedProject === p.id ? 'none' : '1px solid var(--border)',
                        background: selectedProject === p.id ? p.color : 'transparent',
                        color: selectedProject === p.id ? '#fff' : 'var(--text-secondary)',
                        transition: 'all 0.15s',
                    }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: selectedProject === p.id ? 'rgba(255,255,255,0.6)' : p.color, flexShrink: 0 }} />
                        {p.name}
                    </button>
                ))}
            </div>

            {/* Add requirement */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem' }}>
                <input
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleCreate()}
                    placeholder="New requirement..."
                    style={{ ...inputStyle, flex: 1, padding: '8px 12px', fontSize: '13px' }}
                />
                <button onClick={handleCreate} style={{
                    background: 'var(--accent)', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '8px 18px', fontSize: '13px',
                    fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}>Add</button>
            </div>

            {error && <p style={{ fontSize: '12px', color: '#e85555', marginBottom: '12px' }}>{error}</p>}

            {/* Table header */}
            {requirements.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 110px 160px 110px',
                    gap: '8px', padding: '6px 12px',
                    fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                    borderBottom: '1px solid var(--border)', marginBottom: '4px',
                }}>
                    <span>Requirement</span>
                    <span>Hours</span>
                    <span>MoSCoW</span>
                    <span>Sprint</span>
                    <span></span>
                </div>
            )}

            {/* Grouped rows */}
            {(['must', 'should', 'could', 'wont'] as Moscow[]).map(m => {
                const reqs = grouped[m]
                if (reqs.length === 0) return null
                const style = MOSCOW_STYLES[m]
                return (
                    <div key={m} style={{ marginBottom: '16px' }}>
                        {/* Group label */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px 4px' }}>
                            <span style={{
                                fontSize: '11px', fontWeight: 500, padding: '2px 8px',
                                borderRadius: '4px', color: style.color, background: style.bg,
                            }}>{style.label}</span>
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {reqs.length} · {reqs.reduce((s, r) => s + Number(r.hours), 0)}h
                            </span>
                        </div>

                        {/* Rows */}
                        {reqs.map(req => (
                            <div key={req.id} style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 80px 110px 160px 110px',
                                gap: '8px', padding: '8px 12px',
                                borderBottom: '1px solid var(--border)',
                                alignItems: 'center',
                                transition: 'background 0.1s',
                            }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                                {/* Name */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        value={req.name}
                                        onChange={e => handleUpdate(req.id, { name: e.target.value })}
                                        onBlur={e => handleUpdate(req.id, { name: e.target.value.trim() })}
                                        style={{
                                            ...inputStyle, background: 'transparent', border: 'none',
                                            padding: '4px 0', fontSize: '13px', width: '100%',
                                            textDecoration: req.converted_to_task ? 'line-through' : 'none',
                                            color: req.converted_to_task ? 'var(--text-muted)' : 'var(--text-primary)',
                                        }}
                                    />
                                    {req.converted_to_task === true && (
                                        <span style={{
                                            fontSize: '10px', fontWeight: 500, padding: '2px 6px',
                                            borderRadius: '4px', background: '#04342C', color: '#5DCAA5',
                                            flexShrink: 0, whiteSpace: 'nowrap',
                                        }}>→ Task</span>
                                    )}
                                </div>

                                {/* Hours */}
                                <input
                                    type="number" min={0}
                                    value={req.hours || ''}
                                    onChange={e => handleUpdate(req.id, { hours: Number(e.target.value) })}
                                    placeholder="0"
                                    style={{ ...inputStyle, width: '100%', textAlign: 'right' }}
                                />

                                {/* MoSCoW */}
                                <select
                                    value={req.moscow}
                                    onChange={e => handleUpdate(req.id, { moscow: e.target.value as Moscow })}
                                    style={{
                                        ...inputStyle, width: '100%',
                                        color: MOSCOW_STYLES[req.moscow].color,
                                        background: MOSCOW_STYLES[req.moscow].bg,
                                        border: 'none', fontWeight: 500,
                                    }}
                                >
                                    <option value="must">Must</option>
                                    <option value="should">Should</option>
                                    <option value="could">Could</option>
                                    <option value="wont">Won&apos;t</option>
                                </select>

                                {/* Sprint */}
                                <select
                                    value={req.sprint_id ?? ''}
                                    onChange={e => handleUpdate(req.id, { sprint_id: e.target.value || null })}
                                    style={{ ...inputStyle, width: '100%' }}
                                >
                                    <option value="">No sprint</option>
                                    {sprints.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => handleConvert(req)}
                                        disabled={converting === req.id || req.converted_to_task === true}
                                        title={req.converted_to_task ? 'Already a task' : 'Turn into task'}
                                        style={{
                                            background: 'none', border: '1px solid var(--border)',
                                            borderRadius: '6px', padding: '4px 8px', fontSize: '11px',
                                            color: req.converted_to_task ? 'var(--text-muted)' : 'var(--text-muted)',
                                            cursor: req.converted_to_task ? 'default' : 'pointer',
                                            fontFamily: 'inherit', whiteSpace: 'nowrap',
                                            opacity: req.converted_to_task ? 0.4 : 1,
                                        }}
                                        onMouseEnter={e => {
                                            if (req.converted_to_task) return
                                            e.currentTarget.style.color = 'var(--accent)'
                                            e.currentTarget.style.borderColor = 'var(--accent)'
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.color = 'var(--text-muted)'
                                            e.currentTarget.style.borderColor = 'var(--border)'
                                        }}
                                    >
                                        {converting === req.id ? '...' : req.converted_to_task ? '✓' : '→ Task'}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(req.id)}
                                        style={{
                                            background: 'none', border: 'none', cursor: 'pointer',
                                            color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1,
                                            padding: '0 2px', transition: 'color 0.15s',
                                        }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#e85555')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                                    >×</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            })}

            {requirements.length === 0 && (
                <div style={{
                    textAlign: 'center', padding: '4rem 2rem',
                    color: 'var(--text-muted)', fontSize: '13px',
                    border: '1px dashed var(--border)', borderRadius: '12px',
                }}>
                    <p style={{ marginBottom: '8px', fontSize: '15px' }}>No requirements yet</p>
                    <p>Add a requirement above to get started</p>
                </div>
            )}
        </div>
    )
}