'use client'

import { useEffect, useState } from 'react'
import { getProjects, Project } from '@/lib/projects'
import { getSprints, Sprint } from '@/lib/sprints'
import { getTasks, Task } from '@/lib/tasks'
import { getMembers, Member } from '@/lib/members'

const PRIORITY_STYLES = {
  low: { label: 'Low', color: 'var(--prio-low)', bg: 'var(--prio-low-bg)' },
  medium: { label: 'Medium', color: 'var(--prio-medium)', bg: 'var(--prio-medium-bg)' },
  high: { label: 'High', color: 'var(--prio-high)', bg: 'var(--prio-high-bg)' },
  critical: { label: 'Critical', color: 'var(--prio-critical)', bg: 'var(--prio-critical-bg)' },
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '1.25rem',
    }}>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '28px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</p>}
    </div>
  )
}

function isOverdue(due_date: string | null) {
  if (!due_date) return false
  return new Date(due_date) < new Date()
}

function getMemberInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

interface ProjectData {
  project: Project
  sprints: Sprint[]
  tasks: Task[]
  members: Member[]
}

export default function DashboardPage() {
  const [data, setData] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjects().then(async projects => {
      const all = await Promise.all(projects.map(async project => {
        const [sprints, members] = await Promise.all([
          getSprints(project.id),
          getMembers(project.id),
        ])
        const activeSprints = sprints.filter(s => s.status === 'active')
        const sprintsToLoad = activeSprints.length > 0 ? activeSprints : sprints.slice(0, 1)
        const taskArrays = await Promise.all(sprintsToLoad.map(s => getTasks(s.id)))
        const tasks = taskArrays.flat()
        return { project, sprints, tasks, members }
      }))
      setData(all)
      setLoading(false)
    })
  }, [])

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>

  if (data.length === 0) return (
    <div style={{ padding: '2rem 2.5rem' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Dashboard</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create a project to get started.</p>
    </div>
  )

  // Global stats
  const allTasks = data.flatMap(d => d.tasks)
  const totalTasks = allTasks.length
  const doneTasks = allTasks.filter(t => t.status === 'done').length
  const overdueTasks = allTasks.filter(t => isOverdue(t.due_date) && t.status !== 'done').length
  const criticalTasks = allTasks.filter(t => t.priority === 'critical' && t.status !== 'done').length

  return (
    <div style={{ padding: '2rem 2.5rem', maxWidth: '1000px' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>Dashboard</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Overview across all active sprints</p>
      </div>

      {/* Global stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '2rem' }}>
        <StatCard label="Total tasks" value={totalTasks} sub="across active sprints" />
        <StatCard label="Completed" value={`${doneTasks} / ${totalTasks}`} sub={totalTasks > 0 ? `${Math.round(doneTasks / totalTasks * 100)}%` : '—'} />
        <StatCard label="Overdue" value={overdueTasks} sub={overdueTasks > 0 ? 'needs attention' : 'all on track'} />
        <StatCard label="Critical" value={criticalTasks} sub="open tasks" />
      </div>

      {/* Per project */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {data.map(({ project, sprints, tasks, members }) => {
          const activeSprints = sprints.filter(s => s.status === 'active')
          const sprintLabel = activeSprints.length > 0
            ? activeSprints.map(s => s.name).join(', ')
            : sprints[0]?.name ?? '—'
          const done = tasks.filter(t => t.status === 'done').length
          const inProgress = tasks.filter(t => t.status === 'in-progress').length
          const todo = tasks.filter(t => t.status === 'todo').length
          const progress = tasks.length > 0 ? Math.round(done / tasks.length * 100) : 0
          const urgentTasks = tasks
            .filter(t => t.status !== 'done' && (t.priority === 'critical' || t.priority === 'high' || isOverdue(t.due_date)))
            .slice(0, 4)

          return (
            <div key={project.id} style={{
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '12px', overflow: 'hidden',
            }}>
              {/* Project header */}
              <div style={{
                padding: '1rem 1.25rem',
                borderBottom: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: project.color, flexShrink: 0 }} />
                  <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)' }}>{project.name}</span>
                  {sprintLabel && (
                    <span style={{
                      fontSize: '11px', padding: '2px 8px', borderRadius: '999px',
                      background: 'var(--bg-raised)', color: 'var(--text-muted)',
                    }}>{sprintLabel}</span>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Member avatars */}
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {members.slice(0, 4).map(m => (
                      <span key={m.id} title={m.name} style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: project.color, color: '#fff',
                        fontSize: '9px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{getMemberInitials(m.name)}</span>
                    ))}
                    {members.length > 4 && (
                      <span style={{
                        width: '24px', height: '24px', borderRadius: '50%',
                        background: 'var(--bg-raised)', color: 'var(--text-muted)',
                        fontSize: '9px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>+{members.length - 4}</span>
                    )}
                  </div>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{progress}%</span>
                </div>
              </div>

              <div style={{ padding: '1rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {/* Progress bar */}
                <div style={{ height: '4px', background: 'var(--bg-raised)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: project.color, borderRadius: '2px', transition: 'width 0.3s' }} />
                </div>

                {/* Task counts */}
                <div style={{ display: 'flex', gap: '16px' }}>
                  {[
                    { label: 'To Do', value: todo, color: 'var(--text-muted)' },
                    { label: 'In Progress', value: inProgress, color: '#f59e0b' },
                    { label: 'Done', value: done, color: '#10b981' },
                  ].map(s => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{s.label}</span>
                      <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>{s.value}</span>
                    </div>
                  ))}
                </div>

                {/* Urgent tasks */}
                {urgentTasks.length > 0 && (
                  <div>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>
                      Needs attention
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {urgentTasks.map(task => {
                        const p = PRIORITY_STYLES[task.priority ?? 'medium']
                        const assignee = members.find(m => m.id === task.assignee_id)
                        const overdue = isOverdue(task.due_date)
                        return (
                          <div key={task.id} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            padding: '6px 10px', background: 'var(--bg-raised)',
                            borderRadius: '8px',
                          }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 500, padding: '2px 6px',
                              borderRadius: '4px', color: p.color, background: p.bg, flexShrink: 0,
                            }}>{p.label}</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-primary)', flex: 1 }}>{task.title}</span>
                            {overdue && (
                              <span style={{ fontSize: '10px', color: '#ef4444', flexShrink: 0 }}>
                                ⚠ {new Date(task.due_date!).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                              </span>
                            )}
                            {assignee && (
                              <span title={assignee.name} style={{
                                width: '20px', height: '20px', borderRadius: '50%',
                                background: project.color, color: '#fff',
                                fontSize: '8px', fontWeight: 600, flexShrink: 0,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                              }}>{getMemberInitials(assignee.name)}</span>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {tasks.length === 0 && (
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No tasks in active sprint.</p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}