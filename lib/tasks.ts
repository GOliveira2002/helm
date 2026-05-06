import { getDB } from './db'

export type Priority = 'low' | 'medium' | 'high' | 'critical'

export interface Task {
  id: string
  sprint_id: string
  title: string
  description: string
  notes: string
  status: 'todo' | 'in-progress' | 'done'
  priority: Priority
  assignee_id: string | null
  start_date: string | null
  due_date: string | null
  completed_at: string | null
  story_points: number
  position: number
  created_at: string
}

export async function getTasks(sprint_id: string): Promise<Task[]> {
  const db = await getDB()
  return db.select(
    'SELECT * FROM tasks WHERE sprint_id = $1 ORDER BY position ASC, created_at ASC',
    [sprint_id]
  )
}

export async function createTask(
  sprint_id: string,
  title: string,
  story_points = 0,
  priority: Priority = 'medium',
  assignee_id: string | null = null,
  due_date: string | null = null,
): Promise<Task> {
  const db = await getDB()
  const id = crypto.randomUUID()
  const result = await db.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM tasks WHERE sprint_id = $1',
    [sprint_id]
  )
  const position = result[0]?.count ?? 0
  await db.execute(
    'INSERT INTO tasks (id, sprint_id, title, story_points, priority, assignee_id, due_date, position) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
    [id, sprint_id, title, story_points, priority, assignee_id, due_date, position]
  )
  return { id, sprint_id, title, description: '', notes: '', status: 'todo', priority, assignee_id, due_date, start_date: null, completed_at: null, story_points, position, created_at: new Date().toISOString() }
}

export async function updateTaskStatus(id: string, status: Task['status']): Promise<void> {
  const db = await getDB()
  await db.execute('UPDATE tasks SET status = $1 WHERE id = $2', [status, id])
}

export async function updateTaskPosition(id: string, status: Task['status'], position: number): Promise<void> {
  const db = await getDB()
  const completed_at = status === 'done' ? new Date().toISOString() : null
  await db.execute(
    'UPDATE tasks SET status = $1, position = $2, completed_at = $3 WHERE id = $4',
    [status, position, completed_at, id]
  )
}

export async function updateTask(
  id: string,
  fields: Partial<Pick<Task, 'priority' | 'assignee_id' | 'start_date' | 'due_date' | 'notes' | 'story_points'>>
): Promise<void> {
  const db = await getDB()
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return
  const set = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ')
  const values = [...entries.map(([, v]) => v), id]
  await db.execute(`UPDATE tasks SET ${set} WHERE id = $${entries.length + 1}`, values)
}

export async function deleteTask(id: string): Promise<void> {
  const db = await getDB()
  await db.execute('DELETE FROM tasks WHERE id = $1', [id])
}