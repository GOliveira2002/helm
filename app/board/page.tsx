'use client'

import { useEffect, useState } from 'react'
import {
    DndContext, DragEndEvent, DragOverEvent, DragOverlay, DragStartEvent,
    PointerSensor, useSensor, useSensors, closestCorners, useDroppable,
} from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { getTasks, createTask, deleteTask, updateTaskPosition, updateTask, Task, Priority } from '@/lib/tasks'
import { getSprints, Sprint } from '@/lib/sprints'
import { getProjects, Project } from '@/lib/projects'
import { getMembers, Member } from '@/lib/members'

const COLUMNS: { id: Task['status']; label: string; color: string }[] = [
    { id: 'todo', label: 'To Do', color: '#8c8880' },
    { id: 'in-progress', label: 'In Progress', color: '#f59e0b' },
    { id: 'done', label: 'Done', color: '#10b981' },
]

const PRIORITY_STYLES: Record<Priority, { label: string; color: string; bg: string }> = {
    low: { label: 'Low', color: 'var(--prio-low)', bg: 'var(--prio-low-bg)' },
    medium: { label: 'Medium', color: 'var(--prio-medium)', bg: 'var(--prio-medium-bg)' },
    high: { label: 'High', color: 'var(--prio-high)', bg: 'var(--prio-high-bg)' },
    critical: { label: 'Critical', color: 'var(--prio-critical)', bg: 'var(--prio-critical-bg)' },
}

function getMemberInitials(name: string) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function isOverdue(due_date: string | null) {
    if (!due_date) return false
    return new Date(due_date) < new Date()
}

// ─── Task Sidebar ───────────────────────────────────────────────────────────

function TaskSidebar({ task, members, onClose, onUpdate, onDelete }: {
    task: Task
    members: Member[]
    onClose: () => void
    onUpdate: (id: string, fields: Partial<Pick<Task, 'priority' | 'assignee_id' | 'start_date' | 'due_date' | 'notes' | 'story_points' | 'completed_at'>>) => void
    onDelete: (id: string) => void
}) {
    const [notes, setNotes] = useState(task.notes ?? '')


    const p = PRIORITY_STYLES[task.priority ?? 'medium']

    const labelStyle: React.CSSProperties = {
        fontSize: '10px', fontWeight: 500, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px',
    }

    const fieldStyle: React.CSSProperties = {
        background: 'var(--bg-raised)', border: '1px solid var(--border)',
        borderRadius: '8px', padding: '7px 10px', fontSize: '13px',
        color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none', width: '100%',
    }

    return (
        <div style={{
            width: '280px', flexShrink: 0,
            background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
            display: 'flex', flexDirection: 'column',
            height: '100%', overflow: 'hidden',
        }}>
            {/* Header */}
            <div style={{
                padding: '16px', borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px',
            }}>
                <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                        {task.title}
                    </p>
                    <span style={{
                        display: 'inline-block', marginTop: '6px',
                        fontSize: '10px', fontWeight: 500, padding: '2px 8px', borderRadius: '4px',
                        color: p.color, background: p.bg,
                    }}>{p.label}</span>
                </div>
                <button onClick={onClose} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1,
                    padding: 0, flexShrink: 0, transition: 'color 0.15s',
                }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >×</button>
            </div>

            {/* Fields */}
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>

                {/* Priority */}
                <div>
                    <p style={labelStyle}>Priority</p>
                    <select value={task.priority ?? 'medium'}
                        onChange={e => onUpdate(task.id, { priority: e.target.value as Priority })}
                        style={fieldStyle}
                    >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                    </select>
                </div>

                {/* Assignee */}
                <div>
                    <p style={labelStyle}>Assignee</p>
                    <select value={task.assignee_id ?? ''}
                        onChange={e => onUpdate(task.id, { assignee_id: e.target.value || null })}
                        style={fieldStyle}
                    >
                        <option value="">Unassigned</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                {/* Start date */}
                <div>
                    <p style={labelStyle}>Start date</p>
                    <input type="date" value={task.start_date ?? ''}
                        onChange={e => onUpdate(task.id, { start_date: e.target.value || null })}
                        style={{ ...fieldStyle, colorScheme: 'dark' }}
                    />
                </div>
                {/* Due date */}
                <div>
                    <p style={labelStyle}>Due date</p>
                    <input type="date" value={task.due_date ?? ''}
                        onChange={e => onUpdate(task.id, { due_date: e.target.value || null })}
                        style={{ ...fieldStyle, colorScheme: 'dark' }}
                    />
                </div>

                {/* Story points */}
                <div>
                    <p style={labelStyle}>Story points</p>
                    <input type="number" min={0} max={100}
                        value={task.story_points || ''}
                        onChange={e => onUpdate(task.id, { story_points: Number(e.target.value) })}
                        placeholder="0"
                        style={fieldStyle}
                    />
                </div>

                {/* Completed at */}
                {task.status === 'done' && (
                    <div>
                        <p style={labelStyle}>Completed at</p>
                        <input type="datetime-local" value={task.completed_at ?? ''}
                            onChange={e => onUpdate(task.id, { completed_at: e.target.value || null })}
                            style={fieldStyle}
                            disabled={true}
                        />
                    </div>)
                }

                {/* Notes */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <p style={labelStyle}>Notes</p>
                    <textarea
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        onBlur={() => onUpdate(task.id, { notes })}
                        placeholder="Add notes..."
                        rows={6}
                        style={{
                            ...fieldStyle,
                            resize: 'vertical', lineHeight: 1.6,
                            minHeight: '120px',
                        }}
                    />
                </div>

                {/* Delete */}
                <button onClick={() => { onDelete(task.id); onClose() }} style={{
                    background: 'none', border: '1px solid var(--border)',
                    borderRadius: '8px', padding: '8px', fontSize: '12px',
                    color: '#e85555', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'background 0.15s',
                    marginTop: 'auto',
                }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2e0a0a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                    Delete task
                </button>
            </div>
        </div>
    )
}

// ─── Task Card ───────────────────────────────────────────────────────────────

function TaskCard({ task, members, onSelect, isSelected }: {
    task: Task
    members: Member[]
    onSelect: (task: Task) => void
    isSelected: boolean
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
    const assignee = members.find(m => m.id === task.assignee_id)
    const p = PRIORITY_STYLES[task.priority ?? 'medium']
    const overdue = isOverdue(task.due_date)

    return (
        <div ref={setNodeRef} style={{
            transform: CSS.Transform.toString(transform),
            transition,
            opacity: isDragging ? 0.4 : 1,
            background: 'var(--bg-surface)',
            border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: '10px',
            overflow: 'hidden',
            cursor: 'pointer',
        }}
            onClick={() => onSelect(task)}
        >
            <div {...attributes} {...listeners} style={{ padding: '10px 12px 8px', userSelect: 'none' }}>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.5 }}>
                    {task.title}
                </p>
            </div>

            <div style={{ padding: '0 12px 10px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{
                    fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px',
                    color: p.color, background: p.bg,
                }}>{p.label}</span>

                {Number(task.story_points) > 0 && (
                    <span style={{
                        fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px',
                        color: 'var(--text-muted)', background: 'var(--bg-raised)',
                    }}>{task.story_points} pts</span>
                )}

                {task.due_date && (
                    <span style={{
                        fontSize: '10px', fontWeight: 500, padding: '2px 7px', borderRadius: '4px',
                        color: overdue ? '#ef4444' : 'var(--text-muted)',
                        background: overdue ? '#2e0a0a' : 'var(--bg-raised)',
                    }}>
                        {overdue ? '⚠ ' : ''}{new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                    </span>
                )}

                {assignee && (
                    <span style={{
                        fontSize: '10px', fontWeight: 600, width: '22px', height: '22px',
                        borderRadius: '50%', background: 'var(--accent)', color: '#fff',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginLeft: 'auto',
                    }} title={assignee.name}>
                        {getMemberInitials(assignee.name)}
                    </span>
                )}
            </div>
        </div>
    )
}

// ─── Column ──────────────────────────────────────────────────────────────────

function Column({ col, tasks, members, onSelect, selectedTaskId, onAdd }: {
    col: typeof COLUMNS[0]
    tasks: Task[]
    members: Member[]
    onSelect: (task: Task) => void
    selectedTaskId: string | null
    onAdd: (status: Task['status'], title: string, points: number, priority: Priority, assignee_id: string | null, due_date: string | null) => void
}) {
    const [showInput, setShowInput] = useState(false)
    const [title, setTitle] = useState('')
    const [points, setPoints] = useState(0)
    const [priority, setPriority] = useState<Priority>('medium')
    const [assigneeId, setAssigneeId] = useState('')
    const [dueDate, setDueDate] = useState('')

    const { setNodeRef, isOver } = useDroppable({ id: col.id })

    function handleAdd() {
        if (!title.trim()) return
        onAdd(col.id, title.trim(), points, priority, assigneeId || null, dueDate || null)
        setTitle(''); setPoints(0); setPriority('medium'); setAssigneeId(''); setDueDate('')
        setShowInput(false)
    }

    const inputStyle: React.CSSProperties = {
        background: 'var(--bg-surface)', border: '1px solid var(--border)',
        borderRadius: '6px', padding: '6px 8px', fontSize: '12px',
        color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
    }

    return (
        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: col.color, flexShrink: 0 }} />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {col.label}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-raised)', padding: '1px 6px', borderRadius: '4px' }}>
                        {tasks.length}
                    </span>
                </div>
                <button onClick={() => setShowInput(v => !v)} style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--text-muted)', fontSize: '18px', lineHeight: 1, padding: 0,
                }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
                >+</button>
            </div>

            <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div ref={setNodeRef} style={{
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    minHeight: '120px', padding: '4px', borderRadius: '8px',
                    background: isOver ? 'var(--bg-overlay)' : tasks.length === 0 ? 'var(--bg-raised)' : 'transparent',
                    border: tasks.length === 0 ? '1px dashed var(--border)' : '1px solid transparent',
                    transition: 'background 0.15s',
                }}>
                    {tasks.length === 0 && (
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '1.5rem 0' }}>
                            Drop here
                        </p>
                    )}
                    {tasks.map(task => (
                        <TaskCard key={task.id} task={task} members={members}
                            onSelect={onSelect} isSelected={selectedTaskId === task.id}
                        />
                    ))}
                </div>
            </SortableContext>

            {showInput && (
                <div style={{
                    background: 'var(--bg-surface)', border: '1px solid var(--border)',
                    borderRadius: '10px', padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: '7px',
                }}>
                    <input autoFocus value={title} onChange={e => setTitle(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleAdd()}
                        placeholder="Task title..."
                        style={{ ...inputStyle, width: '100%' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <select value={priority} onChange={e => setPriority(e.target.value as Priority)} style={{ ...inputStyle, flex: 1 }}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                        <input type="number" min={0} max={100} value={points || ''} onChange={e => setPoints(Number(e.target.value))}
                            placeholder="pts" style={{ ...inputStyle, width: '52px' }}
                        />
                    </div>
                    <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={{ ...inputStyle, width: '100%' }}>
                        <option value="">Unassigned</option>
                        {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                    <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)}
                        style={{ ...inputStyle, width: '100%', colorScheme: 'dark' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={handleAdd} style={{
                            background: 'var(--accent)', color: '#fff', border: 'none',
                            borderRadius: '6px', padding: '6px 12px', fontSize: '12px',
                            fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', flex: 1,
                        }}>Add</button>
                        <button onClick={() => setShowInput(false)} style={{
                            background: 'none', border: '1px solid var(--border)', borderRadius: '6px',
                            padding: '6px 10px', fontSize: '12px', color: 'var(--text-muted)',
                            cursor: 'pointer', fontFamily: 'inherit',
                        }}>✕</button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function BoardPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [sprints, setSprints] = useState<Sprint[]>([])
    const [tasks, setTasks] = useState<Task[]>([])
    const [members, setMembers] = useState<Member[]>([])
    const [selectedProject, setSelectedProject] = useState('')
    const [selectedSprint, setSelectedSprint] = useState('')
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [loading, setLoading] = useState(true)
    const [activeTask, setActiveTask] = useState<Task | null>(null)

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

    useEffect(() => {
        getProjects().then(p => {
            setProjects(p)
            if (p.length === 0) { setLoading(false); return }
            const firstProject = p[0].id
            setSelectedProject(firstProject)
            Promise.all([getSprints(firstProject), getMembers(firstProject)]).then(([s, m]) => {
                setSprints(s); setMembers(m)
                const active = s.find(sp => sp.status === 'active')
                const sprintId = active?.id ?? s[0]?.id ?? ''
                setSelectedSprint(sprintId)
                if (sprintId) getTasks(sprintId).then(t => { setTasks(t); setLoading(false) })
                else setLoading(false)
            })
        })
    }, [])

    useEffect(() => {
        if (!selectedProject || projects.length === 0) return
        Promise.all([getSprints(selectedProject), getMembers(selectedProject)]).then(([s, m]) => {
            setSprints(s); setMembers(m)
            const active = s.find(sp => sp.status === 'active')
            const sprintId = active?.id ?? s[0]?.id ?? ''
            setSelectedSprint(sprintId)
            setSelectedTask(null)
            if (sprintId) getTasks(sprintId).then(setTasks)
            else setTasks([])
        })
    }, [projects.length, selectedProject])

    function getColumnTasks(status: Task['status']) {
        return tasks.filter(t => t.status === status)
    }

    async function handleAdd(status: Task['status'], title: string, points: number, priority: Priority, assignee_id: string | null, due_date: string | null) {
        if (!selectedSprint) return
        const task = await createTask(selectedSprint, title, points, priority, assignee_id, due_date)
        const newTask = { ...task, status }
        await updateTaskPosition(task.id, status, tasks.filter(t => t.status === status).length)
        setTasks(prev => [...prev, newTask])
    }

    async function handleDelete(id: string) {
        await deleteTask(id)
        setTasks(prev => prev.filter(t => t.id !== id))
        if (selectedTask?.id === id) setSelectedTask(null)
    }

    async function handleUpdate(id: string, fields: Partial<Pick<Task, 'priority' | 'assignee_id' | 'due_date' | 'notes' | 'story_points'>>) {
        await updateTask(id, fields)
        setTasks(prev => prev.map(t => t.id === id ? { ...t, ...fields } : t))
        setSelectedTask(prev => prev?.id === id ? { ...prev, ...fields } : prev)
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveTask(tasks.find(t => t.id === event.active.id) ?? null)
    }

    function handleDragOver(event: DragOverEvent) {
        const { active, over } = event
        if (!over) return
        const activeId = active.id as string
        const overId = over.id as string
        const overColumn = COLUMNS.find(c => c.id === overId)
        if (overColumn) {
            setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: overColumn.id } : t))
            return
        }
        const overTask = tasks.find(t => t.id === overId)
        if (!overTask) return
        const activeItem = tasks.find(t => t.id === activeId)
        if (!activeItem || activeItem.status === overTask.status) return
        setTasks(prev => prev.map(t => t.id === activeId ? { ...t, status: overTask.status } : t))
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveTask(null)
        if (!over) return
        const activeId = active.id as string
        const task = tasks.find(t => t.id === activeId)
        if (!task) return
        const colTasks = tasks.filter(t => t.status === task.status)
        const position = colTasks.findIndex(t => t.id === activeId)
        await updateTaskPosition(activeId, task.status, position)
    }

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>

    if (projects.length === 0) return (
        <div style={{ padding: '2rem 2.5rem' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Board</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create a project first.</p>
        </div>
    )

    return (
        <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

            {/* Main content */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                {/* Header */}
                <div style={{ padding: '2rem 2rem 1rem', flexShrink: 0 }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px' }}>Board</h1>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
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
                    {sprints.length > 0 && (
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            {sprints.map(s => (
                                <button key={s.id} onClick={() => { setSelectedSprint(s.id); setSelectedTask(null); getTasks(s.id).then(setTasks) }} style={{
                                    padding: '4px 12px', borderRadius: '6px', fontSize: '12px',
                                    cursor: 'pointer', fontFamily: 'inherit', border: '1px solid var(--border)',
                                    background: selectedSprint === s.id ? 'var(--bg-overlay)' : 'transparent',
                                    color: selectedSprint === s.id ? 'var(--text-primary)' : 'var(--text-muted)',
                                    fontWeight: selectedSprint === s.id ? 500 : 400, transition: 'all 0.15s',
                                }}>{s.name}</button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Board */}
                <div style={{ flex: 1, padding: '0 2rem 2rem', overflow: 'auto' }}>
                    {!selectedSprint ? (
                        <div style={{
                            textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)',
                            fontSize: '13px', border: '1px dashed var(--border)', borderRadius: '12px',
                        }}>
                            <p style={{ marginBottom: '8px', fontSize: '15px' }}>No sprints found</p>
                            <p>Create a sprint in the Sprints page first.</p>
                        </div>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCorners}
                            onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}
                        >
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', minHeight: '100%' }}>
                                {COLUMNS.map(col => (
                                    <Column key={col.id} col={col} tasks={getColumnTasks(col.id)}
                                        members={members} onSelect={setSelectedTask}
                                        selectedTaskId={selectedTask?.id ?? null} onAdd={handleAdd}
                                    />
                                ))}
                            </div>
                            <DragOverlay>
                                {activeTask && (
                                    <div style={{
                                        background: 'var(--bg-surface)', border: '1px solid var(--border-strong)',
                                        borderRadius: '10px', padding: '10px 12px', fontSize: '13px',
                                        color: 'var(--text-primary)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', cursor: 'grabbing',
                                    }}>{activeTask.title}</div>
                                )}
                            </DragOverlay>
                        </DndContext>
                    )}
                </div>
            </div>

            {/* Task sidebar */}
            {selectedTask && (
                <TaskSidebar
                    key={selectedTask.id}
                    task={selectedTask}
                    members={members}
                    onClose={() => setSelectedTask(null)}
                    onUpdate={handleUpdate}
                    onDelete={handleDelete}
                />
            )}
        </div>
    )
}