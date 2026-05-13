'use client'

import { useEffect, useState } from 'react'
import { getProjects, createProject, deleteProject, Project } from '@/lib/projects'
import { getMembers, getAllMembers, addMemberToProject, removeMemberFromProject, Member } from '@/lib/members'
const COLORS = [
    '#e8622a', '#6366f1', '#0ea5e9', '#10b981',
    '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6',
]

function MembersPanel({ project }: { project: Project }) {
  const [projectMembers, setProjectMembers] = useState<Member[]>([])
  const [allMembers, setAllMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getMembers(project.id), getAllMembers()]).then(([pm, am]) => {
      setProjectMembers(pm)
      setAllMembers(am)
      setLoading(false)
    })
  }, [project.id])

  async function handleAdd(member_id: string) {
    await addMemberToProject(project.id, member_id)
    const member = allMembers.find(m => m.id === member_id)
    if (member) setProjectMembers(prev => [...prev, member])
  }

  async function handleRemove(member_id: string) {
    await removeMemberFromProject(project.id, member_id)
    setProjectMembers(prev => prev.filter(m => m.id !== member_id))
  }

  function getInitials(n: string) {
    return n.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  }

  const available = allMembers.filter(m => !projectMembers.find(pm => pm.id === m.id))

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '12px', marginTop: '4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <p style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Members
        </p>
        <a href="/members" style={{ fontSize: '11px', color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}>
          Manage →
        </a>
      </div>

      {loading ? <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Loading...</p> : (
        <>
          {projectMembers.length === 0 && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>No members assigned.</p>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
            {projectMembers.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '24px', height: '24px', borderRadius: '50%',
                  background: project.color, color: '#fff', fontSize: '10px', fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{getInitials(m.name)}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500 }}>{m.name}</p>
                  {m.email && <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{m.email}</p>}
                </div>
                <button onClick={() => handleRemove(m.id)} style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1,
                  padding: 0, transition: 'color 0.15s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                  title="Remove from project"
                >×</button>
              </div>
            ))}
          </div>

          {available.length > 0 && (
            <div style={{ display: 'flex', gap: '6px' }}>
              <select
                defaultValue=""
                onChange={e => { if (e.target.value) { handleAdd(e.target.value); e.target.value = '' } }}
                style={{
                  flex: 1, background: 'var(--bg-raised)', border: '1px solid var(--border)',
                  borderRadius: '6px', padding: '6px 10px', fontSize: '12px',
                  color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
                }}
              >
                <option value="" disabled>Add member...</option>
                {available.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
          )}
        </>
      )}
    </div>
  )
}

function ProjectCard({ project, onDelete }: { project: Project; onDelete: (id: string) => void }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: '12px', padding: '1.25rem',
            display: 'flex', flexDirection: 'column', gap: '12px',
            transition: 'border-color 0.15s',
        }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
        >
            {/* Color bar */}
            <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: project.color }} />

            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {project.name}
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                    <button onClick={() => setExpanded(v => !v)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: expanded ? 'var(--text-primary)' : 'var(--text-muted)',
                        fontSize: '13px', lineHeight: 1, padding: '0 4px',
                        fontFamily: 'inherit', transition: 'color 0.15s',
                    }}
                        title="Manage members"
                    >👥</button>
                    <button onClick={() => onDelete(project.id)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1,
                        padding: '0 2px', fontFamily: 'inherit', transition: 'color 0.15s',
                    }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#e85555')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                        title="Delete project"
                    >×</button>
                </div>
            </div>

            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {new Date(project.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>

            {expanded && <MembersPanel project={project} />}
        </div>
    )
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [name, setName] = useState('')
    const [color, setColor] = useState(COLORS[0])
    const [error, setError] = useState('')

    useEffect(() => {
        getProjects().then(p => { setProjects(p); setLoading(false) })
    }, [])

    async function handleCreate() {
        if (!name.trim()) return
        setError('')
        try {
            const project = await createProject(name.trim(), color)
            setProjects(prev => [project, ...prev])
            setName('')
            setColor(COLORS[0])
            setShowForm(false)
        } catch (e) {
            if (e instanceof Error) setError(e.message)
            else setError('Failed to create project.')
        }
    }

    async function handleDelete(id: string) {
        await deleteProject(id)
        setProjects(prev => prev.filter(p => p.id !== id))
    }

    if (loading) return (
        <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>
    )

    return (
        <div style={{ padding: '2rem 2.5rem' }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Projects</h1>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {projects.length} {projects.length === 1 ? 'project' : 'projects'}
                    </p>
                </div>
                <button onClick={() => setShowForm(v => !v)} style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'var(--accent)', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
                    fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
                >
                    <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> New project
                </button>
            </div>

            {/* Create form */}
            {showForm && (
                <div style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem',
                }}>
                    <p style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        New project
                    </p>
                    <input
                        autoFocus value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleCreate()}
                        placeholder="Project name..."
                        style={{
                            width: '100%', background: 'var(--bg-raised)', border: '1px solid var(--border)',
                            borderRadius: '8px', padding: '10px 14px', fontSize: '14px',
                            color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', marginBottom: '14px',
                        }}
                    />
                    {error && <p style={{ fontSize: '12px', color: '#e85555', marginBottom: '10px' }}>{error}</p>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Color</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                            {COLORS.map(c => (
                                <button key={c} onClick={() => setColor(c)} style={{
                                    width: '20px', height: '20px', borderRadius: '50%', background: c,
                                    border: color === c ? '2px solid var(--text-primary)' : '2px solid transparent',
                                    cursor: 'pointer', padding: 0, outline: 'none',
                                    boxShadow: color === c ? '0 0 0 1px var(--bg-surface)' : 'none',
                                }} />
                            ))}
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={handleCreate} style={{
                            background: 'var(--accent)', color: '#fff', border: 'none',
                            borderRadius: '8px', padding: '8px 18px', fontSize: '13px',
                            fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                        }}>Create</button>
                        <button onClick={() => { setShowForm(false); setError('') }} style={{
                            background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)',
                            borderRadius: '8px', padding: '8px 18px', fontSize: '13px',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}>Cancel</button>
                    </div>
                </div>
            )}

            {/* Projects grid */}
            {projects.length === 0 && !showForm ? (
                <div style={{
                    textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)',
                    fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '12px',
                }}>
                    <p style={{ marginBottom: '8px', fontSize: '15px' }}>No projects yet</p>
                    <p>Click &quot;New project&quot; to get started</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '12px' }}>
                    {projects.map(project => (
                        <ProjectCard key={project.id} project={project} onDelete={handleDelete} />
                    ))}
                </div>
            )}
        </div>
    )
}