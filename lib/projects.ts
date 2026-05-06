import { getDB } from './db'
import { randomUUID } from 'crypto'

export interface Project {
  id: string
  name: string
  color: string
  created_at: string
}

export async function getProjects(): Promise<Project[]> {
  const db = await getDB()
  return db.select('SELECT * FROM projects ORDER BY created_at DESC')
}

export async function createProject(name: string, color = '#6366f1'): Promise<Project> {
  const db = await getDB()

  const existing = await db.select<Project[]>(
    'SELECT id FROM projects WHERE LOWER(name) = LOWER($1)',
    [name.trim()]
  )

  if (existing.length > 0) {
    throw new Error(`A project named "${name}" already exists.`)
  }

  const id = crypto.randomUUID()
  await db.execute(
    'INSERT INTO projects (id, name, color) VALUES ($1, $2, $3)',
    [id, name, color]
  )
  return { id, name, color, created_at: new Date().toISOString() }
}

export async function deleteProject(id: string): Promise<void> {
  const db = await getDB()
  await db.execute('DELETE FROM projects WHERE id = $1', [id])
}