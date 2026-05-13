'use client'

import { useEffect, useState } from 'react'
import { getMembers, createMember, updateMember, deleteMember, Member, getAllMembers } from '@/lib/members'
import { getRoles, createRole, updateRole, deleteRole, Role } from '@/lib/roles'
import { getProjects, Project } from '@/lib/projects'

const ROLE_COLORS: Record<string, { color: string; bg: string }> = {
    'Scrum Master': { color: 'var(--role-scrum-master)', bg: 'var(--role-scrum-master-bg)' },
    'Product Owner': { color: 'var(--role-product-owner)', bg: 'var(--role-product-owner-bg)' },
    'Developer': { color: 'var(--role-developer)', bg: 'var(--role-developer-bg)' },
    'Viewer': { color: 'var(--role-viewer)', bg: 'var(--role-viewer-bg)' },
}

function getRoleStyle(role: string) {
    return ROLE_COLORS[role] ?? { color: '#9898aa', bg: '#2e2e35' }
}

function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
}

const inputStyle: React.CSSProperties = {
    background: 'var(--bg-raised)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '8px 12px', fontSize: '13px',
    color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', width: '100%',
}

const labelStyle: React.CSSProperties = {
    fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
}

// ─── Member Panel ────────────────────────────────────────────────────────────

function MemberPanel({ project, member, roles, onSaved, onClose }: {
    project: Project
    member: Member | null
    roles: Role[]
    onSaved: (member: Member) => void
    onClose: () => void
}) {
    const [name, setName] = useState(member?.name ?? '')
    const [email, setEmail] = useState(member?.email ?? '')
    const [role_id, setRole] = useState(member?.role_id ?? roles[0]?.id ?? '')
    const [error, setError] = useState('')
    const isEdit = member !== null

    async function handleSave() {
        if (!name.trim()) { setError('Name is required.'); return }
        setError('')
        try {
            if (isEdit) {
                await updateMember(member.id, { name: name.trim(), role_id, email: email.trim() || null })
                onSaved({ ...member, name: name.trim(), role_id, email: email.trim() || null })
            } else {
                const m = await createMember(name.trim(), role_id, email.trim() || null)
                onSaved(m)
            }
            onClose()
        } catch (e) {
            if (e instanceof Error) setError(e.message)
            else setError('Failed to save member.')
            console.log(e)
        }
    }

    return (
        <div style={{
            width: '320px', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', position: 'fixed',
            top: 0, right: 0, bottom: 0, zIndex: 100, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{isEdit ? 'Edit Member' : 'New Member'}</p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{project.name}</p>
                </div>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1, padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >×</button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={labelStyle}>Name *</label>
                    <input autoFocus value={name} onChange={e => setName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                        placeholder="Full name" style={inputStyle} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={labelStyle}>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="member@email.com"
                        style={inputStyle}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <label style={labelStyle}>Role</label>
                    <select value={role_id} onChange={e => setRole(e.target.value)} style={inputStyle}>
                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                </div>

                {error && <p style={{ fontSize: '12px', color: '#f87171' }}>{error}</p>}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: '8px' }}>
                <button onClick={handleSave} style={{
                    flex: 1, background: 'var(--accent)', color: '#fff', border: 'none',
                    borderRadius: '8px', padding: '10px', fontSize: '13px', fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
                >{isEdit ? 'Save changes' : 'Add member'}</button>
                <button onClick={onClose} style={{
                    background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '10px 16px', fontSize: '13px', cursor: 'pointer', fontFamily: 'inherit',
                }}>Cancel</button>
            </div>
        </div>
    )
}

// ─── Roles Manager ───────────────────────────────────────────────────────────

function RolesManager({ roles, onRolesChanged, onClose }: {
    roles: Role[]
    onRolesChanged: (roles: Role[]) => void
    onClose: () => void
}) {
    const [localRoles, setLocalRoles] = useState<Role[]>(roles)
    const [newName, setNewName] = useState('')
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')
    const [error, setError] = useState('')

    async function handleAdd() {
        if (!newName.trim()) return
        setError('')
        try {
            const role = await createRole(newName.trim())
            const updated = [...localRoles, role]
            setLocalRoles(updated)
            onRolesChanged(updated)
            setNewName('')
        } catch (e) {
            if (e instanceof Error) setError(e.message)
        }
    }

    async function handleUpdate(id: string) {
        if (!editingName.trim()) return
        await updateRole(id, editingName.trim())
        const updated = localRoles.map(r => r.id === id ? { ...r, name: editingName.trim() } : r)
        setLocalRoles(updated)
        onRolesChanged(updated)
        setEditingId(null)
    }

    async function handleDelete(id: string) {
        await deleteRole(id)
        const updated = localRoles.filter(r => r.id !== id)
        setLocalRoles(updated)
        onRolesChanged(updated)
    }

    return (
        <div style={{
            width: '300px', background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column', position: 'fixed',
            top: 0, right: 0, bottom: 0, zIndex: 100, boxShadow: '-8px 0 32px rgba(0,0,0,0.15)',
        }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Manage Roles</p>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '20px', lineHeight: 1, padding: 0 }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >×</button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
                {localRoles.map(r => (
                    <div key={r.id} style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        padding: '8px 12px', background: 'var(--bg-raised)',
                        borderRadius: '8px', border: '1px solid var(--border)',
                    }}>
                        {editingId === r.id ? (
                            <>
                                <input autoFocus value={editingName} onChange={e => setEditingName(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter') handleUpdate(r.id); if (e.key === 'Escape') setEditingId(null) }}
                                    style={{ ...inputStyle, flex: 1, padding: '4px 8px', fontSize: '12px' }}
                                />
                                <button onClick={() => handleUpdate(r.id)} style={{
                                    background: 'var(--accent)', color: '#fff', border: 'none',
                                    borderRadius: '6px', padding: '4px 10px', fontSize: '11px',
                                    fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                                }}>Save</button>
                                <button onClick={() => setEditingId(null)} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1, padding: 0,
                                }}>×</button>
                            </>
                        ) : (
                            <>
                                <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)' }}>{r.name}</span>
                                <button onClick={() => { setEditingId(r.id); setEditingName(r.name) }} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-muted)', fontSize: '12px', padding: '2px 6px',
                                    borderRadius: '4px', fontFamily: 'inherit', transition: 'color 0.15s',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                                >Edit</button>
                                <button onClick={() => handleDelete(r.id)} style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: 'var(--text-muted)', fontSize: '16px', lineHeight: 1, padding: 0,
                                    transition: 'color 0.15s',
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.color = '#f87171')}
                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                                >×</button>
                            </>
                        )}
                    </div>
                ))}

                {error && <p style={{ fontSize: '12px', color: '#f87171' }}>{error}</p>}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)' }}>
                <p style={{ ...labelStyle, marginBottom: '8px' }}>Add role</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={newName} onChange={e => setNewName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder="Role name..." style={{ ...inputStyle, fontSize: '12px', padding: '7px 10px' }}
                    />
                    <button onClick={handleAdd} style={{
                        background: 'var(--accent)', color: '#fff', border: 'none',
                        borderRadius: '8px', padding: '7px 14px', fontSize: '12px',
                        fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                    }}>Add</button>
                </div>
            </div>
        </div>
    )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function MembersPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [roles, setRoles] = useState<Role[]>([])
    const [selectedProject, setSelectedProject] = useState('')
    const [loading, setLoading] = useState(true)
    const [panel, setPanel] = useState<Member | null | undefined>(undefined)
    const [showRoles, setShowRoles] = useState(false)

    useEffect(() => {
        Promise.all([getProjects(), getRoles(), getAllMembers()]).then(([p, r, m]) => {
            setProjects(p)
            setRoles(r)
            setMembers(m)
            if (p.length > 0) setSelectedProject(p[0].id)
            setLoading(false)
        })
    }, [])
    async function handleProjectChange(pid: string) {
        setSelectedProject(pid)
        const m = await getMembers(pid)
        setMembers(m)
    }

    function handleSaved(member: Member) {
        setMembers(prev => {
            const exists = prev.find(m => m.id === member.id)
            if (exists) return prev.map(m => m.id === member.id ? member : m)
            return [...prev, member]
        })
    }

    async function handleDelete(id: string) {
        await deleteMember(id)
        setMembers(prev => prev.filter(m => m.id !== id))
    }

    const activeProject = projects.find(p => p.id === selectedProject)
    const grouped = roles.reduce<Record<string, Member[]>>((acc, r) => {
        acc[r.id] = members.filter(m => m.role_id === r.id)
        return acc
    }, {})
    const unassigned = members.filter(m => !roles.find(r => r.id === m.role_id))

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>

    if (projects.length === 0) return (
        <div style={{ padding: '2rem 2.5rem' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '8px' }}>Members</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create a project first.</p>
        </div>
    )

    return (
        <>
            <div style={{ padding: '2rem 2.5rem' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem' }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>Members</h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '3px' }}>
                            {members.length} {members.length === 1 ? 'member' : 'members'} · {activeProject?.name}
                        </p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => setShowRoles(true)} style={{
                            background: 'transparent', color: 'var(--text-secondary)',
                            border: '1px solid var(--border)', borderRadius: '8px',
                            padding: '8px 14px', fontSize: '13px', fontWeight: 500,
                            cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-primary)' }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                        >Manage roles</button>
                        <button onClick={() => setPanel(null)} style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'var(--accent)', color: '#fff', border: 'none',
                            borderRadius: '8px', padding: '8px 16px', fontSize: '13px',
                            fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                        }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-hover)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
                        >
                            <span style={{ fontSize: '16px', lineHeight: 1 }}>+</span> Add member
                        </button>
                    </div>
                </div>

                {/* Project selector */}
                <div style={{ display: 'flex', gap: '6px', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
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

                {/* Members grouped by role */}
                {members.length === 0 ? (
                    <div style={{
                        textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)',
                        fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '12px',
                    }}>
                        <p style={{ fontSize: '15px', fontWeight: 500, marginBottom: '6px', color: 'var(--text-secondary)' }}>No members yet</p>
                        <p>Click &quot;Add member&quot; to get started</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        {[...roles.map(r => r.id), unassigned.length > 0 ? 'Other' : null].filter(Boolean).map(roleId => {
                            const group = roleId === 'Other' ? unassigned : (grouped[roleId!] ?? [])
                            if (group.length === 0) return null
                            const roleName = roles.find(r => r.id === roleId)?.name ?? 'Other'
                            const rs = getRoleStyle(roleName)
                            return (
                                <div key={roleId}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                                        <span style={{
                                            fontSize: '11px', fontWeight: 500, padding: '2px 8px',
                                            borderRadius: '4px', color: rs.color, background: rs.bg,
                                        }}>{roleName}</span>
                                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{group.length}</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {group.map(member => (
                                            <div key={member.id} style={{
                                                display: 'flex', alignItems: 'center', gap: '12px',
                                                padding: '12px 16px', background: 'var(--bg-surface)',
                                                border: '1px solid var(--border)', borderRadius: '10px',
                                                cursor: 'pointer', transition: 'border-color 0.15s',
                                            }}
                                                onClick={() => setPanel(member)}
                                                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--border-strong)')}
                                                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
                                            >
                                                <div style={{
                                                    width: '36px', height: '36px', borderRadius: '50%',
                                                    background: activeProject?.color, color: '#fff',
                                                    fontSize: '12px', fontWeight: 600, flexShrink: 0,
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>{getInitials(member.name)}</div>
                                                <div style={{ flex: 1 }}>
                                                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{member.name}</p>
                                                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                                        {roles.find(r => r.id === member.role_id)?.name ?? '—'}
                                                    </p>                                                </div>
                                                <button onClick={e => { e.stopPropagation(); handleDelete(member.id) }} style={{
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1,
                                                    padding: '0 2px', transition: 'color 0.15s',
                                                }}
                                                    onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = '#f87171' }}
                                                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                                                >×</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Member panel */}
            {panel !== undefined && activeProject && (
                <>
                    <div onClick={() => setPanel(undefined)} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
                        zIndex: 99, backdropFilter: 'blur(2px)',
                    }} />
                    <MemberPanel
                        key={panel?.id ?? 'new'}
                        project={activeProject}
                        member={panel}
                        roles={roles}
                        onSaved={handleSaved}
                        onClose={() => setPanel(undefined)}
                    />
                </>
            )}

            {/* Roles manager */}
            {showRoles && (
                <>
                    <div onClick={() => setShowRoles(false)} style={{
                        position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
                        zIndex: 99, backdropFilter: 'blur(2px)',
                    }} />
                    <RolesManager
                        roles={roles}
                        onRolesChanged={setRoles}
                        onClose={() => setShowRoles(false)}
                    />
                </>
            )}
        </>
    )
}