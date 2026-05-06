import { getDB } from './db'

export interface SprintVelocity {
  sprint_name: string
  completed_points: number
  total_points: number
}

export interface BurndownPoint {
  date: string
  ideal: number
  remaining: number
}

export interface TaskBreakdown {
  by_status: { name: string; value: number }[]
  by_priority: { name: string; value: number }[]
  by_assignee: { name: string; value: number }[]
}

export async function getVelocity(project_id: string): Promise<SprintVelocity[]> {
  const db = await getDB()
  const sprints = await db.select<{ id: string; name: string }[]>(
    'SELECT id, name FROM sprints WHERE project_id = $1 ORDER BY created_at ASC',
    [project_id]
  )

  const result: SprintVelocity[] = []
  for (const sprint of sprints) {
    const tasks = await db.select<{ story_points: number; status: string }[]>(
      'SELECT story_points, status FROM tasks WHERE sprint_id = $1',
      [sprint.id]
    )
    const total = tasks.reduce((sum, t) => sum + Number(t.story_points), 0)
    const completed = tasks.filter(t => t.status === 'done').reduce((sum, t) => sum + Number(t.story_points), 0)
    result.push({ sprint_name: sprint.name, completed_points: completed, total_points: total })
  }
  return result
}

export async function getBurndown(sprint_id: string): Promise<BurndownPoint[]> {
  const db = await getDB()

  const sprint = await db.select<{ start_date: string; end_date: string }[]>(
    'SELECT start_date, end_date FROM sprints WHERE id = $1',
    [sprint_id]
  )
  if (!sprint[0]) return []

  const tasks = await db.select<{ story_points: number; completed_at: string | null }[]>(
    'SELECT story_points, completed_at FROM tasks WHERE sprint_id = $1',
    [sprint_id]
  )

  const start = new Date(sprint[0].start_date)
  const end = new Date(sprint[0].end_date)
  const totalPoints = tasks.reduce((sum, t) => sum + Number(t.story_points), 0)
  const days: BurndownPoint[] = []

  const msPerDay = 86400000
  const totalDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / msPerDay))

  let day = new Date(start)
  while (day <= end) {
    const dayStr = day.toISOString().split('T')[0]
    const completedByDay = tasks
      .filter(t => t.completed_at && t.completed_at.split('T')[0] <= dayStr)
      .reduce((sum, t) => sum + Number(t.story_points), 0)

    const elapsed = Math.round((day.getTime() - start.getTime()) / msPerDay)
    const ideal = Math.round(totalPoints * (1 - elapsed / totalDays))

    days.push({ date: dayStr, ideal, remaining: totalPoints - completedByDay })
    day = new Date(day.getTime() + msPerDay)
  }

  return days
}

export async function getTaskBreakdown(sprint_id: string): Promise<TaskBreakdown> {
  const db = await getDB()

  const tasks = await db.select<{
    status: string
    priority: string
    assignee_id: string | null
  }[]>(
    'SELECT status, priority, assignee_id FROM tasks WHERE sprint_id = $1',
    [sprint_id]
  )

  const members = await db.select<{ id: string; name: string }[]>(
    `SELECT m.id, m.name FROM members m
     INNER JOIN sprints s ON s.project_id = m.project_id
     WHERE s.id = $1`,
    [sprint_id]
  )

  const count = <T extends string>(arr: T[], key: T) =>
    arr.filter(t => t === key).length

  const statuses: Task['status'][] = ['todo', 'in-progress', 'done'] as const
  const priorities = ['low', 'medium', 'high', 'critical']

  return {
    by_status: [
      { name: 'To Do',       value: count(tasks.map(t => t.status), 'todo') },
      { name: 'In Progress', value: count(tasks.map(t => t.status), 'in-progress') },
      { name: 'Done',        value: count(tasks.map(t => t.status), 'done') },
    ].filter(d => d.value > 0),

    by_priority: priorities.map(p => ({
      name: p.charAt(0).toUpperCase() + p.slice(1),
      value: count(tasks.map(t => t.priority), p),
    })).filter(d => d.value > 0),

    by_assignee: [
      ...members.map(m => ({
        name: m.name,
        value: tasks.filter(t => t.assignee_id === m.id).length,
      })),
      { name: 'Unassigned', value: tasks.filter(t => !t.assignee_id).length },
    ].filter(d => d.value > 0),
  }
}

type Task = { status: string; priority: string; assignee_id: string | null }