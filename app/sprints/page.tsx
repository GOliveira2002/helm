'use client'

import { useEffect, useState } from 'react'
import { getSprints, createSprint, deleteSprint, updateSprintStatus, Sprint } from '@/lib/sprints'
import { getProjects, Project } from '@/lib/projects'
import { getDB } from '@/lib/db'

const STATUS_STYLES: Record<Sprint['status'], { label: string; color: string; bg: string }> = {
  planned:   { label: 'Planned',   color: 'var(--sprint-status-planned)',   bg: 'var(--sprint-status-planned-bg)' },
  active:    { label: 'Active',    color: 'var(--sprint-status-active)',     bg: 'var(--sprint-status-active-bg)' },
  completed: { label: 'Completed', color: 'var(--sprint-status-completed)', bg: 'var(--sprint-status-completed-bg)' },
}

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-raised)', border: '1px solid var(--border)',
  borderRadius: '8px', padding: '8px 12px', fontSize: '13px',
  color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
  colorScheme: 'dark', width: '100%',
}

const labelStyle: React.CSSProperties = {
  fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em',
}

async function updateSprint(id: string, fields: Partial<Pick<Sprint, 'name' | 'description' | 'start_date' | 'end_date' | 'status'>>): Promise<void> {
  const db = await getDB()
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return
  const set = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ')
  const values = [...entries.map(([, v]) => v), id]
  await db.execute(`UPDATE sprints SET ${set} WHERE id = $${entries.length + 1}`, values)
}

function SprintPanel({ project, sprint, onSaved, onClose }: {
  project: Project
  sprint: Sprint | null  // null = create mode
  onSaved: (sprint: Sprint) => void
  onClose: () => void
}) {
  const [name, setName] = useState(sprint?.name ?? '')
  const [startDate, setStartDate] = useState(sprint?.start_date ?? '')
  const [endDate, setEndDate] = useState(sprint?.end_date ?? '')
  const [description, setDescription] = useState(sprint?.description ?? '')
  const [status, setStatus] = useState<Sprint['status']>(sprint?.status ?? 'planned')
  const [error, setError] = useState('')

  const isEdit = sprint !== null

  async function handleSave() {
    if (!name.trim() || !startDate || !endDate) { setError('Fill in all required fields.'); return }
    setError('')
    try {
      if (isEdit) {
        await updateSprint(sprint.id, { name: name.trim(), description, start_date: startDate, end_date: endDate, status })
        onSaved({ ...sprint, name: name.trim(), description, start_date: startDate, end_date: endDate, status })
      } else {
        const s = await createSprint(project.id, name.trim(), description, startDate, endDate)
        onSaved(s)
      }
      onClose()
    } catch (e) {
      if (e instanceof Error) setError(e.message)
      else setError('Failed to save sprint.')
    }
  }

  return (
    <div style={{
      width: '340px', flexShrink: 0, background: 'var(--bg-surface)',
      borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 100,
      boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 24px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
            {isEdit ? 'Edit Sprint' : 'New Sprint'}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{project.name}</p>
        </div>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1, padding: 0,
        }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >×</button>
      </div>

      {/* Fields */}
      <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>Sprint name *</label>
          <input autoFocus={!isEdit} value={name} onChange={e => setName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            placeholder="e.g. Sprint 1" style={inputStyle} />
        </div>

        {isEdit && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={labelStyle}>Status</label>
            <select value={status} onChange={e => setStatus(e.target.value as Sprint['status'])} style={inputStyle}>
              <option value="planned">Planned</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <label style={labelStyle}>Start date *</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
            <label style={labelStyle}>End date *</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} min={startDate} style={inputStyle} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={labelStyle}>Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Optional sprint goal or description..."
            rows={4}
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
          />
        </div>

        {error && <p style={{ fontSize: '12px', color: '#f87171' }}>{error}</p>}
      </div>

      {/* Footer */}
      <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
        <button onClick={handleSave} style={{
          flex: 1, background: 'var(--accent)', color: '#fff', border: 'none',
          borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 500,
          cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
        }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
        >{isEdit ? 'Save changes' : 'Create sprint'}</button>
        <button onClick={onClose} style={{
          background: 'transparent', color: 'var(--text-muted)',
          border: '1px solid var(--border)', borderRadius: '8px',
          padding: '10px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
        }}>Cancel</button>
      </div>
    </div>
  )
}

export default function SprintsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [selectedProject, setSelectedProject] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [panelSprint, setPanelSprint] = useState<Sprint | null | undefined>(undefined) // undefined = closed, null = create, Sprint = edit

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

  async function handleDelete(id: string) {
    await deleteSprint(id)
    setSprints(prev => prev.filter(s => s.id !== id))
  }

  async function handleStatus(id: string, status: Sprint['status']) {
    await updateSprintStatus(id, status)
    setSprints(prev => prev.map(s => s.id === id ? { ...s, status } : s))
  }

  function handleSaved(sprint: Sprint) {
    setSprints(prev => {
      const exists = prev.find(s => s.id === sprint.id)
      if (exists) return prev.map(s => s.id === sprint.id ? sprint : s)
      return [sprint, ...prev]
    })
  }

  const activeProject = projects.find(p => p.id === selectedProject)
  const showPanel = panelSprint !== undefined

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>

  if (projects.length === 0) return (
    <div style={{ padding: '2rem 2.5rem' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Sprints</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create a project first before adding sprints.</p>
    </div>
  )

  return (
    <>
      <div style={{ padding: '2rem 2.5rem'}}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Sprints</h1>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
              {sprints.length} {sprints.length === 1 ? 'sprint' : 'sprints'} · {activeProject?.name}
            </p>
          </div>
          <button onClick={() => setPanelSprint(null)} style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            background: 'var(--accent)', color: '#fff', border: 'none',
            borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
            fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
          >
            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> New sprint
          </button>
        </div>

        {/* Project selector */}
        <div style={{ display: 'flex', gap: '6px', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
          {projects.map(p => (
            <button key={p.id} onClick={() => setSelectedProject(p.id)} style={{
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

        {/* Sprint list */}
        {sprints.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)',
            fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '12px',
          }}>
            <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>No sprints yet</p>
            <p>Click &quot;New sprint&quot; to get started</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {sprints.map(sprint => {
              const s = STATUS_STYLES[sprint.status]
              const start = new Date(sprint.start_date)
              const end = new Date(sprint.end_date)
              const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000))
              const elapsed = Math.max(0, Math.round((new Date().getTime() - start.getTime()) / 86400000))
              const progress = sprint.status === 'completed' ? 100 : Math.min(100, Math.round(elapsed / totalDays * 100))

              return (
                <div key={sprint.id} style={{
                  background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '12px', padding: '16px 20px', transition: 'border-color 0.15s',
                  cursor: 'pointer',
                }}
                  onClick={() => setPanelSprint(sprint)}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
                      <div style={{ width: '3px', height: '40px', borderRadius: '2px', background: activeProject?.color, flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>{sprint.name}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                          {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          {' → '}
                          {end.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          {' · '}{totalDays} days
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        background: s.bg, color: s.color, borderRadius: '6px',
                        padding: '4px 8px', fontSize: '11px', fontWeight: 500,
                      }}>{s.label}</span>
                      <button
                        onClick={e => { e.stopPropagation(); handleDelete(sprint.id) }}
                        style={{
                          background: 'none', border: 'none', cursor: 'pointer',
                          color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1,
                          padding: '0 2px', transition: 'color 0.15s',
                        }}
                        onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = '#f87171' }}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                      >×</button>
                    </div>
                  </div>

                  {sprint.description && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px', paddingLeft: '15px' }}>
                      {sprint.description}
                    </p>
                  )}

                  {sprint.status !== 'planned' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ flex: 1, height: '3px', background: 'var(--bg-overlay)', borderRadius: '999px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', width: `${progress}%`,
                          background: sprint.status === 'completed' ? 'var(--sprint-status-completed)' : activeProject?.color,
                          borderRadius: '999px', transition: 'width 0.3s',
                        }} />
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0 }}>{progress}%</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {showPanel && activeProject && (
        <>
          <div onClick={() => setPanelSprint(undefined)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
            zIndex: 99, backdropFilter: 'blur(2px)',
          }} />
          <SprintPanel
            key={panelSprint?.id ?? 'new'}
            project={activeProject}
            sprint={panelSprint ?? null}
            onSaved={handleSaved}
            onClose={() => setPanelSprint(undefined)}
          />
        </>
      )}
    </>
  )
}