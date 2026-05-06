import { getDB } from './db'

export interface Member {
  id: string
  project_id: string
  name: string
  created_at: string
}

export async function getMembers(project_id: string): Promise<Member[]> {
  const db = await getDB()
  return db.select(
    'SELECT * FROM members WHERE project_id = $1 ORDER BY name ASC',
    [project_id]
  )
}

export async function createMember(project_id: string, name: string): Promise<Member> {
  const db = await getDB()

  const existing = await db.select<Member[]>(
    'SELECT id FROM members WHERE project_id = $1 AND LOWER(name) = LOWER($2)',
    [project_id, name.trim()]
  )
  if (existing.length > 0) throw new Error(`Member "${name}" already exists in this project.`)

  const id = crypto.randomUUID()
  await db.execute(
    'INSERT INTO members (id, project_id, name) VALUES ($1, $2, $3)',
    [id, project_id, name.trim()]
  )
  return { id, project_id, name: name.trim(), created_at: new Date().toISOString() }
}

export async function deleteMember(id: string): Promise<void> {
  const db = await getDB()
  await db.execute('DELETE FROM members WHERE id = $1', [id])
}