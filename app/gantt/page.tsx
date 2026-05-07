'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getProjects, Project } from '@/lib/projects'
import { getSprints, updateSprintDates } from '@/lib/sprints'
import { getTasks, updateTask, Task } from '@/lib/tasks'

const ROW_HEIGHT = 50
const HEADER_HEIGHT = 48
const LABEL_WIDTH = 220
const MIN_BAR_WIDTH = 20
const DAY_WIDTH = 32

function getDays(start: Date, end: Date): Date[] {
    const days: Date[] = []
    const cur = new Date(start)
    while (cur <= end) {
        days.push(new Date(cur))
        cur.setDate(cur.getDate() + 1)
    }
    return days
}

function dateToX(date: Date, startDate: Date): number {
    const diff = Math.floor((date.getTime() - startDate.getTime()) / 86400000)
    return diff * DAY_WIDTH
}

function xToDate(x: number, startDate: Date): Date {
    const days = Math.round(x / DAY_WIDTH)
    const d = new Date(startDate)
    d.setDate(d.getDate() + days)
    return d
}

function toISO(d: Date): string {
    return d.toISOString().split('T')[0]
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

const STATUS_COLORS: Record<Task['status'], string> = {
    'todo': '#5a5752',
    'in-progress': '#f59e0b',
    'done': '#10b981',
}

const SPRINT_COLOR = '#6366f1'

interface Row {
    type: 'sprint' | 'task'
    id: string
    label: string
    start: Date | null
    end: Date | null
    color: string
    sprintId?: string
    status?: Task['status']
}

interface DragState {
    rowId: string
    mode: 'move' | 'resize-left' | 'resize-right'
    startX: number
    origStart: Date
    origEnd: Date
}

export default function GanttPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProject, setSelectedProject] = useState('')
    const [rows, setRows] = useState<Row[]>([])
    const [loading, setLoading] = useState(true)
    const [ganttStart, setGanttStart] = useState<Date>(new Date())
    const [ganttEnd, setGanttEnd] = useState<Date>(new Date())
    const dragRef = useRef<DragState | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    const loadData = useCallback(async (projectId: string) => {
        setLoading(true)
        const sprints = await getSprints(projectId)
        const allRows: Row[] = []
        let minDate: Date | null = null
        let maxDate: Date | null = null

        for (const sprint of sprints) {
            const start = sprint.start_date ? new Date(sprint.start_date) : null
            const end = sprint.end_date ? new Date(sprint.end_date) : null
            if (start && (!minDate || start < minDate)) minDate = new Date(start)
            if (end && (!maxDate || end > maxDate)) maxDate = new Date(end)
            allRows.push({
                type: 'sprint', id: sprint.id, label: sprint.name,
                start, end, color: SPRINT_COLOR,
            })
            const tasks = await getTasks(sprint.id)
            for (const task of tasks) {
                const ts = task.start_date ? new Date(task.start_date) : null
                const te = task.due_date ? new Date(task.due_date) : null
                if (ts && (!minDate || ts < minDate)) minDate = new Date(ts)
                if (te && (!maxDate || te > maxDate)) maxDate = new Date(te)
                allRows.push({
                    type: 'task', id: task.id, label: task.title,
                    start: ts, end: te,
                    color: STATUS_COLORS[task.status],
                    sprintId: sprint.id, status: task.status,
                })
            }
        }

        const base = minDate ?? new Date()
        const baseEnd = maxDate ?? new Date(base.getTime() + 30 * 86400000)
        const gStart = new Date(base); gStart.setDate(gStart.getDate() - 4)
        const gEnd = new Date(baseEnd); gEnd.setDate(gEnd.getDate() + 365)
        setGanttStart(gStart)
        setGanttEnd(gEnd)
        setRows(allRows)
        setLoading(false)
    }, [])

    useEffect(() => {
        getProjects().then(async p => {
            setProjects(p)
            if (p.length === 0) { setLoading(false); return }
            const firstId = p[0].id
            setSelectedProject(firstId)
            await loadData(firstId)
        })
    }, [])

    const days = getDays(ganttStart, ganttEnd)
    const totalWidth = days.length * DAY_WIDTH
    const today = new Date()
    const todayX = dateToX(today, ganttStart)

    // Group months for header
    const months: { label: string; x: number; width: number }[] = []
    let currentMonth = -1
    days.forEach((d, i) => {
        if (d.getMonth() !== currentMonth) {
            currentMonth = d.getMonth()
            months.push({ label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`, x: i * DAY_WIDTH, width: 0 })
        }
        months[months.length - 1].width += DAY_WIDTH
    })

    function onMouseDown(e: React.MouseEvent, row: Row, mode: DragState['mode']) {
        if (!row.start || !row.end) return
        e.preventDefault()
        e.stopPropagation()
        dragRef.current = {
            rowId: row.id, mode,
            startX: e.clientX,
            origStart: new Date(row.start),
            origEnd: new Date(row.end),
        }
    }

    function onMouseMove(e: MouseEvent) {
        const drag = dragRef.current
        if (!drag) return
        const dx = e.clientX - drag.startX
        const daysDelta = Math.round(dx / DAY_WIDTH)

        setRows(prev => prev.map(row => {
            if (row.id !== drag.rowId || !row.start || !row.end) return row
            let newStart = new Date(drag.origStart)
            let newEnd = new Date(drag.origEnd)

            if (drag.mode === 'move') {
                newStart.setDate(newStart.getDate() + daysDelta)
                newEnd.setDate(newEnd.getDate() + daysDelta)
            } else if (drag.mode === 'resize-left') {
                newStart.setDate(newStart.getDate() + daysDelta)
                if (newStart >= newEnd) newStart = new Date(newEnd.getTime() - 86400000)
            } else if (drag.mode === 'resize-right') {
                newEnd.setDate(newEnd.getDate() + daysDelta)
                if (newEnd <= newStart) newEnd = new Date(newStart.getTime() + 86400000)
            }

            return { ...row, start: newStart, end: newEnd }
        }))
    }

    async function onMouseUp() {
        const drag = dragRef.current
        if (!drag) return
        dragRef.current = null

        const row = rows.find(r => r.id === drag.rowId)
        if (!row || !row.start || !row.end) return

        if (row.type === 'task') {
            await updateTask(row.id, {
                start_date: toISO(row.start),
                due_date: toISO(row.end),
            })
        } else if (row.type === 'sprint') {
            await updateSprintDates(row.id, toISO(row.start), toISO(row.end))
        }
    }

    useEffect(() => {
        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('mouseup', onMouseUp)
        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('mouseup', onMouseUp)
        }
    }, [rows])

    if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>

    if (projects.length === 0) return (
        <div style={{ padding: '2rem 2.5rem' }}>
            <h1 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Gantt</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create a project first.</p>
        </div>
    )

    return (
        <div style={{ padding: '2rem 2.5rem', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

            {/* Header */}
            <div style={{ marginBottom: '1.25rem', flexShrink: 0 }}>
                <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px' }}>Gantt</h1>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {projects.map(p => (
                        <button key={p.id} onClick={() => {
                            setSelectedProject(p.id)
                            loadData(p.id)
                        }} style={{
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
                {/* Date range controls */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>From</label>
                        <input
                            type="date"
                            value={toISO(ganttStart)}
                            onChange={e => setGanttStart(new Date(e.target.value))}
                            style={{
                                background: 'var(--bg-raised)', border: '1px solid var(--border)',
                                borderRadius: '6px', padding: '4px 8px', fontSize: '12px',
                                color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
                                colorScheme: 'dark',
                            }}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>To</label>
                        <input
                            type="date"
                            value={toISO(ganttEnd)}
                            onChange={e => setGanttEnd((new Date(e.target.value)))}
                            style={{
                                background: 'var(--bg-raised)', border: '1px solid var(--border)',
                                borderRadius: '6px', padding: '4px 8px', fontSize: '12px',
                                color: 'var(--text-primary)', fontFamily: 'inherit', outline: 'none',
                                colorScheme: 'dark',
                            }}
                        />
                    </div>
                    <button
                        onClick={() => loadData(selectedProject)}
                        style={{
                            background: 'transparent', border: '1px solid var(--border)',
                            borderRadius: '6px', padding: '4px 12px', fontSize: '12px',
                            color: 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit',
                        }}
                    >Reset</button>
                </div>
            </div>

            {/* Gantt */}
            <div
                ref={containerRef}
                style={{
                    flex: 1,
                    overflow: 'auto',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                    minHeight: 0,
                }}
            >
                <div style={{ display: 'flex', minWidth: LABEL_WIDTH + totalWidth }}>

                    {/* Label column */}
                    <div style={{ width: LABEL_WIDTH, flexShrink: 0, borderRight: '1px solid var(--border)' }}>
                        {/* Corner */}
                        <div style={{ height: HEADER_HEIGHT, borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)' }} />
                        {rows.map((row, i) => (
                            <div key={row.id} style={{
                                height: ROW_HEIGHT,
                                display: 'flex', alignItems: 'center',
                                padding: row.type === 'sprint' ? '0 12px' : '0 12px 0 28px',
                                borderBottom: '1px solid var(--border)',
                                background: row.type === 'sprint' ? 'var(--bg-raised)' : 'var(--bg-surface)',
                                gap: '8px',
                            }}>
                                {row.type === 'sprint' && (
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: SPRINT_COLOR, flexShrink: 0 }} />
                                )}
                                {row.type === 'task' && (
                                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: row.color, flexShrink: 0 }} />
                                )}
                                <span style={{
                                    fontSize: row.type === 'sprint' ? '12px' : '11px',
                                    fontWeight: row.type === 'sprint' ? 500 : 400,
                                    color: row.type === 'sprint' ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>{row.label}</span>
                            </div>
                        ))}
                    </div>

                    {/* Timeline */}
                    <div style={{ flex: 1, position: 'relative' }}>
                        {/* Month header */}
                        <div style={{ height: HEADER_HEIGHT / 2, display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', position: 'sticky', top: 0, zIndex: 2 }}>
                            {months.map((m, i) => (
                                <div key={i} style={{
                                    width: m.width, flexShrink: 0,
                                    borderRight: '1px solid var(--border)',
                                    display: 'flex', alignItems: 'center', padding: '0 8px',
                                    fontSize: '11px', fontWeight: 500, color: 'var(--text-secondary)',
                                }}>{m.label}</div>
                            ))}
                        </div>

                        {/* Day header */}
                        <div style={{ height: HEADER_HEIGHT / 2, display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', position: 'sticky', top: HEADER_HEIGHT / 2, zIndex: 2 }}>
                            {days.map((d, i) => {
                                const isWeekend = d.getDay() === 0 || d.getDay() === 6
                                const isToday = toISO(d) === toISO(today)
                                return (
                                    <div key={i} style={{
                                        width: DAY_WIDTH, flexShrink: 0, textAlign: 'center',
                                        fontSize: '10px',
                                        color: isToday ? 'var(--accent)' : isWeekend ? 'var(--text-muted)' : 'var(--text-secondary)',
                                        fontWeight: isToday ? 600 : 400,
                                        borderRight: '1px solid var(--border)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        background: isToday ? 'var(--accent-subtle)' : 'transparent',
                                    }}>{d.getDate()}</div>
                                )
                            })}
                        </div>

                        {/* Rows */}
                        {rows.map((row, i) => {
                            const isSprint = row.type === 'sprint'
                            const barStart = row.start ? dateToX(row.start, ganttStart) : null
                            const barEnd = row.end ? dateToX(row.end, ganttStart) + DAY_WIDTH : null
                            const barWidth = barStart !== null && barEnd !== null ? Math.max(barEnd - barStart, MIN_BAR_WIDTH) : 0

                            return (
                                <div key={row.id} style={{
                                    height: ROW_HEIGHT, position: 'relative',
                                    borderBottom: '1px solid var(--border)',
                                    background: isSprint ? 'var(--bg-raised)' : 'var(--bg-surface)',
                                }}>
                                    {/* Vertical day lines */}
                                    {days.map((_, di) => (
                                        <div key={di} style={{
                                            position: 'absolute', left: di * DAY_WIDTH, top: 0, bottom: 0,
                                            width: 1, background: 'var(--border)', opacity: 0.5,
                                        }} />
                                    ))}

                                    {/* Today line */}
                                    {todayX >= 0 && todayX <= totalWidth && (
                                        <div style={{
                                            position: 'absolute', left: todayX, top: 0, bottom: 0,
                                            width: 2, background: 'var(--accent)', opacity: 0.8, zIndex: 1,
                                        }} />
                                    )}

                                    {/* Bar */}
                                    {barStart !== null && barWidth > 0 && (
                                        <div
                                            onMouseDown={e => onMouseDown(e, row, 'move')}
                                            style={{
                                                position: 'absolute',
                                                left: barStart,
                                                top: isSprint ? 8 : 10,
                                                width: barWidth,
                                                height: isSprint ? 30 : 26,
                                                background: row.color,
                                                borderRadius: isSprint ? '4px' : '3px',
                                                opacity: isSprint ? 0.9 : 0.85,
                                                cursor: 'grab',
                                                zIndex: 2,
                                                display: 'flex', alignItems: 'center',
                                                overflow: 'hidden',
                                            }}
                                        >
                                            {/* Resize left */}
                                            <div onMouseDown={e => onMouseDown(e, row, 'resize-left')} style={{
                                                width: 6, height: '100%', cursor: 'ew-resize',
                                                background: 'rgba(0,0,0,0.2)', flexShrink: 0,
                                            }} />

                                            {/* Label inside bar */}
                                            <span style={{
                                                flex: 1, fontSize: '10px', fontWeight: 500,
                                                color: '#fff', padding: '0 4px',
                                                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                            }}>{row.label}</span>

                                            {/* Resize right */}
                                            <div onMouseDown={e => onMouseDown(e, row, 'resize-right')} style={{
                                                width: 6, height: '100%', cursor: 'ew-resize',
                                                background: 'rgba(0,0,0,0.2)', flexShrink: 0,
                                            }} />
                                        </div>
                                    )}

                                    {/* No dates placeholder */}
                                    {(barStart === null || barWidth === 0) && row.type === 'task' && (
                                        <div
                                            onClick={() => {
                                                const sprint = rows.find(r => r.type === 'sprint' && r.id === row.sprintId)
                                                const defaultStart = sprint?.start ?? new Date()
                                                const defaultEnd = new Date(defaultStart)
                                                defaultEnd.setDate(defaultEnd.getDate() + 3)
                                                setRows(prev => prev.map(r =>
                                                    r.id === row.id ? { ...r, start: defaultStart, end: defaultEnd } : r
                                                ))
                                                updateTask(row.id, {
                                                    start_date: toISO(defaultStart),
                                                    due_date: toISO(defaultEnd),
                                                })
                                            }}
                                            style={{
                                                position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)',
                                                fontSize: '10px', color: 'var(--accent)', cursor: 'pointer',
                                                padding: '2px 8px', border: '1px dashed var(--accent)',
                                                borderRadius: '4px', opacity: 0.7, transition: 'opacity 0.15s',
                                            }}
                                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.7')}
                                        >
                                            + set dates
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
        </div>
    )
}