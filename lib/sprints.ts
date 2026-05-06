import { getDB } from './db'

export interface Sprint {
  id: string
  project_id: string
  name: string
  start_date: string
  end_date: string
  status: 'active' | 'completed' | 'planned'
  created_at: string
}

export async function getSprints(project_id: string): Promise<Sprint[]> {
  const db = await getDB()
  return db.select(
    'SELECT * FROM sprints WHERE project_id = $1 ORDER BY created_at DESC',
    [project_id]
  )
}

export async function createSprint(
  project_id: string,
  name: string,
  start_date: string,
  end_date: string
): Promise<Sprint> {
  const db = await getDB()

  const existing = await db.select<Sprint[]>(
    'SELECT id FROM sprints WHERE project_id = $1 AND LOWER(name) = LOWER($2)',
    [project_id, name.trim()]
  )
  if (existing.length > 0) throw new Error(`A sprint named "${name}" already exists.`)

  const id = crypto.randomUUID()
  await db.execute(
    'INSERT INTO sprints (id, project_id, name, start_date, end_date) VALUES ($1, $2, $3, $4, $5)',
    [id, project_id, name, start_date, end_date]
  )
  return { id, project_id, name, start_date, end_date, status: 'active', created_at: new Date().toISOString() }
}

export async function deleteSprint(id: string): Promise<void> {
  const db = await getDB()
  await db.execute('DELETE FROM sprints WHERE id = $1', [id])
}

export async function updateSprintStatus(id: string, status: Sprint['status']): Promise<void> {
  const db = await getDB()
  await db.execute('UPDATE sprints SET status = $1 WHERE id = $2', [status, id])
}

export async function updateSprintDates(id: string, start_date: string, end_date: string): Promise<void> {
  const db = await getDB()
  await db.execute(
    'UPDATE sprints SET start_date = $1, end_date = $2 WHERE id = $3',
    [start_date, end_date, id]
  )
}