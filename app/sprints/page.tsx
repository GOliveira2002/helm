'use client'

import { useEffect, useState } from 'react'
import { getSprints, createSprint, deleteSprint, updateSprintStatus, Sprint } from '@/lib/sprints'
import { getProjects, Project } from '@/lib/projects'

const STATUS_STYLES: Record<Sprint['status'], { label: string; color: string; bg: string }> = {
    planned: { label: 'Planned', color: 'var(--sprint-status-planned)', bg: 'var(--sprint-status-planned-bg)' },
    active: { label: 'Active', color: 'var(--sprint-status-active)', bg: 'var(--sprint-status-active-bg)' },
    completed: { label: 'Completed', color: 'var(--sprint-status-completed)', bg: 'var(--sprint-status-completed-bg)' },
}

export default function SprintsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [sprints, setSprints] = useState<Sprint[]>([])
    const [selectedProject, setSelectedProject] = useState<string>('')
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [error, setError] = useState('')

    const [name, setName] = useState('')
    const [startDate, setStartDate] = useState('')
    const [endDate, setEndDate] = useState('')

    useEffect(() => {
        getProjects().then(p => {
            setProjects(p)
            if (p.length > 0) setSelectedProject(p[0].id)
            setLoading(false)
        })
    }, [])

    useEffect(() => {
        if (!selectedProject) return
        getSprints(selectedProject).then(setSprints)
    }, [selectedProject])

    async function handleCreate() {
        if (!name.trim() || !startDate || !endDate) return
        setError('')
        if (new Date(endDate) <= new Date(startDate)) {
            setError('End date must be after start date.')
            return
        }
        try {
            const sprint = await createSprint(selectedProject, name.trim(), startDate, endDate)
            setSprints(prev => [sprint, ...prev])
            setName('')
            setStartDate('')
            setEndDate('')
            setShowForm(false)
        } catch (e) {
            if (e instanceof Error) setError(e.message)
            else setError('Failed to create sprint.')
        }
    }

    async function handleDelete(id: string) {
        await deleteSprint(id)
        setSprints(prev => prev.filter(s => s.id !== id))
    }

    async function handleStatus(id: string, status: Sprint['status']) {
        await updateSprintStatus(id, status)
        setSprints(prev => prev.map(s => s.id === id ? { ...s, status } : s))
    }

    const inputStyle: React.CSSProperties = {
        background: 'var(--bg-raised)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '8px 12px', fontSize: '13px',
        color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
        colorScheme: 'dark',
    }

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>

    if (projects.length === 0) return (
        <div style={{ padding: '2rem 2.5rem' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Sprints</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create a project first before adding sprints.</p>
        </div>
    )

    const activeProject = projects.find(p => p.id === selectedProject)

    return (
        <div style={{ padding: '2rem 2.5rem', maxWidth: '860px' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Sprints</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{sprints.length} {sprints.length === 1 ? 'sprint' : 'sprints'}</p>
                </div>
                <button onClick={() => setShowForm(v => !v)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'var(--accent)', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
                    fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
                >
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> New sprint
                </button>
            </div>

            {/* Project selector */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {projects.map(p => (
                    <button key={p.id} onClick={() => setSelectedProject(p.id)} style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        padding: '6px 14px', borderRadius: '999px', fontSize: '12px',
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

            {/* Create form */}
            {showForm && (
                <div style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
                }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        New sprint · {activeProject?.name}
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                        <input
                            autoFocus
                            value={name}
                            onChange={e => setName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            placeholder="Sprint name... (e.g. Sprint 1)"
                            style={{ ...inputStyle, width: '100%' }}
                        />
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Start date</label>
                                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ ...inputStyle, width: '100%' }} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1 }}>
                                <label style={{ fontSize: '11px', color: 'var(--text-muted)' }}>End date</label>
                                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} style={{ ...inputStyle, width: '100%' }} />                            </div>
                        </div>
                    </div>

                    {error && <p style={{ fontSize: '12px', color: '#e85555', marginBottom: '10px' }}>{error}</p>}

                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleCreate} style={{
                            background: 'var(--accent)', color: '#fff', border: 'none',
                            borderRadius: '8px', padding: '8px 18px', fontSize: '13px',
                            fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                        }}>Create</button>
                        <button onClick={() => { setShowForm(false); setError('') }} style={{
                            background: 'transparent', color: 'var(--text-muted)',
                            border: '1px solid var(--border)', borderRadius: '8px',
                            padding: '8px 18px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                        }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Sprints list */}
            {sprints.length === 0 && !showForm ? (
                <div style={{
                    textAlign: 'center', padding: '4rem 2rem',
                    color: 'var(--text-muted)', fontSize: '13px',
                    border: '1px dashed var(--border)', borderRadius: '12px',
                }}>
                    <p style={{ marginBottom: '8px', fontSize: '15px' }}>No sprints yet</p>
                    <p>Click &quot;New sprint&quot; to get started</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {sprints.map(sprint => {
                        const s = STATUS_STYLES[sprint.status]
                        return (
                            <div key={sprint.id} style={{
                                background: 'var(--bg-surface)', border: '1px solid var(--border)',
                                borderRadius: '12px', padding: '1rem 1.25rem',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
                                transition: 'border-color 0.15s',
                            }}
                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                                    <div style={{ width: '3px', height: '36px', borderRadius: '2px', background: activeProject?.color, flexShrink: 0 }} />
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '3px' }}>{sprint.name}</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                            {new Date(sprint.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                                            {' → '}
                                            {new Date(sprint.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <select
                                        value={sprint.status}
                                        onChange={e => handleStatus(sprint.id, e.target.value as Sprint['status'])}
                                        style={{
                                            background: s.bg, color: s.color,
                                            border: 'none', borderRadius: '6px',
                                            padding: '4px 8px', fontSize: '11px', fontWeight: 500,
                                            fontFamily: 'inherit', cursor: 'pointer', outline: 'none',
                                        }}
                                    >
                                        <option value="planned">Planned</option>
                                        <option value="active">Active</option>
                                        <option value="completed">Completed</option>
                                    </select>

                                    <button onClick={() => handleDelete(sprint.id)} style={{
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1,
                                        padding: '0 2px', fontFamily: 'inherit', transition: 'color 0.15s',
                                    }}
                                        onMouseEnter={e => (e.currentTarget.style.color = '#e85555')}
                                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                                        title="Delete sprint"
                                    >×</button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}