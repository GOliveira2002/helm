'use client'

import React, { useEffect, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { getProjects, Project } from '@/lib/projects'
import { getSprints, Sprint } from '@/lib/sprints'
import { getVelocity, getBurndown, getTaskBreakdown, SprintVelocity, BurndownPoint, TaskBreakdown } from '@/lib/analytics'

const COLORS = ['#e8622a', '#6366f1', '#10b981', '#f59e0b', '#0ea5e9', '#ec4899', '#8b5cf6']

const tooltipStyle = {
  background: 'var(--bg-overlay)',
  border: '1px solid var(--border)',
  borderRadius: '8px',
  fontSize: '12px',
  color: 'var(--text-primary)',
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)',
      textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px',
    }}>{children}</p>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--bg-surface)', border: '1px solid var(--border)',
      borderRadius: '12px', padding: '1.25rem',
      ...style,
    }}>
      {children}
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>{label}</p>
      <p style={{ fontSize: '24px', fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
      {sub && <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{sub}</p>}
    </Card>
  )
}

export default function AnalyticsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [sprints, setSprints] = useState<Sprint[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [selectedSprint, setSelectedSprint] = useState('')
  const [velocity, setVelocity] = useState<SprintVelocity[]>([])
  const [burndown, setBurndown] = useState<BurndownPoint[]>([])
  const [breakdown, setBreakdown] = useState<TaskBreakdown | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getProjects().then(p => {
      setProjects(p)
      if (p.length === 0) { setLoading(false); return }
      const pid = p[0].id
      setSelectedProject(pid)
      Promise.all([getSprints(pid), getVelocity(pid)]).then(([s, v]) => {
        setSprints(s)
        setVelocity(v)
        const active = s.find(sp => sp.status === 'active')
        const sprintId = active?.id ?? s[0]?.id ?? ''
        setSelectedSprint(sprintId)
        if (sprintId) {
          Promise.all([getBurndown(sprintId), getTaskBreakdown(sprintId)]).then(([b, bd]) => {
            setBurndown(b); setBreakdown(bd); setLoading(false)
          })
        } else setLoading(false)
      })
    })
  }, [])

  useEffect(() => {
  if (!selectedProject) return
  Promise.all([getSprints(selectedProject), getVelocity(selectedProject)]).then(([s, v]) => {
    setSprints(s); setVelocity(v)
    const active = s.find(sp => sp.status === 'active')
    const sprintId = active?.id ?? s[0]?.id ?? ''
    setSelectedSprint(sprintId)
    if (sprintId) {
      Promise.all([getBurndown(sprintId), getTaskBreakdown(sprintId)]).then(([b, bd]) => {
        setBurndown(b); setBreakdown(bd)
      })
    } else {
      setBurndown([]); setBreakdown(null)
    }
  })
}, [selectedProject])

  function handleSprintChange(sprintId: string) {
    setSelectedSprint(sprintId)
    Promise.all([getBurndown(sprintId), getTaskBreakdown(sprintId)]).then(([b, bd]) => {
      setBurndown(b); setBreakdown(bd)
    })
  }

  if (loading) return <div style={{ padding: '2rem', color: 'var(--text-muted)', fontSize: '13px' }}>Loading...</div>

  if (projects.length === 0) return (
    <div style={{ padding: '2rem 2.5rem' }}>
      <h1 style={{ fontSize: '20px', fontWeight: 500, marginBottom: '8px' }}>Analytics</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Create a project first.</p>
    </div>
  )

  const currentSprint = sprints.find(s => s.id === selectedSprint)
  const totalTasks = breakdown ? breakdown.by_status.reduce((s, d) => s + d.value, 0) : 0
  const doneTasks = breakdown?.by_status.find(d => d.name === 'Done')?.value ?? 0
  const avgVelocity = velocity.length > 0
    ? Math.round(velocity.reduce((s, v) => s + v.completed_points, 0) / velocity.length)
    : 0
  const lastVelocity = velocity[velocity.length - 1]?.completed_points ?? 0

  return (
    <div style={{ padding: '2rem 2.5rem' }}>

      {/* Header */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '12px' }}>Analytics</h1>

        {/* Project selector */}
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

        {/* Sprint selector */}
        {sprints.length > 0 && (
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {sprints.map(s => (
              <button key={s.id} onClick={() => handleSprintChange(s.id)} style={{
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

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '1.5rem' }}>
        <StatCard label="Total tasks" value={totalTasks} sub={currentSprint?.name} />
        <StatCard label="Completed" value={`${doneTasks} / ${totalTasks}`} sub={totalTasks > 0 ? `${Math.round(doneTasks / totalTasks * 100)}%` : '—'} />
        <StatCard label="Avg velocity" value={avgVelocity} sub="pts / sprint" />
        <StatCard label="Last sprint" value={lastVelocity} sub="story points" />
      </div>

      {/* Burndown */}
      <Card style={{ marginBottom: '12px' }}>
        <SectionTitle>Burndown — {currentSprint?.name ?? '—'}</SectionTitle>
        {burndown.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            No data yet — add tasks with story points to this sprint.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={burndown}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={d => {
                const date = new Date(d)
                return `${date.getDate()}/${date.getMonth() + 1}`
              }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={d => new Date(d).toLocaleDateString('en-GB')} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="ideal" stroke="var(--text-muted)" strokeDasharray="4 4" dot={false} name="Ideal" />
              <Line type="monotone" dataKey="remaining" stroke="var(--accent)" strokeWidth={2} dot={false} name="Remaining" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Velocity */}
      <Card style={{ marginBottom: '12px' }}>
        <SectionTitle>Velocity per sprint</SectionTitle>
        {velocity.length === 0 ? (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            No sprints with data yet.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={velocity}>
              <XAxis dataKey="sprint_name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="total_points" fill="var(--bg-overlay)" name="Total" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed_points" fill="var(--accent)" name="Completed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </Card>

      {/* Breakdown */}
      {breakdown && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
          {/* By status */}
          <Card>
            <SectionTitle>By status</SectionTitle>
            {breakdown.by_status.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No tasks</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={breakdown.by_status} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                    {breakdown.by_status.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* By priority */}
          <Card>
            <SectionTitle>By priority</SectionTitle>
            {breakdown.by_priority.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No tasks</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={breakdown.by_priority} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                    {breakdown.by_priority.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* By assignee */}
          <Card>
            <SectionTitle>By assignee</SectionTitle>
            {breakdown.by_assignee.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>No tasks</p>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={breakdown.by_assignee} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65}>
                    {breakdown.by_assignee.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}