import { getDB } from './db'

export interface Member {
  id: string
  name: string
  email: string | null
  role_id: string | null
  created_at: string
}

export async function getAllMembers(): Promise<Member[]> {
  const db = await getDB()
  return db.select('SELECT * FROM members ORDER BY name ASC')
}

export async function getMembers(project_id: string): Promise<Member[]> {
  const db = await getDB()
  return db.select(
    `SELECT m.* FROM members m
     INNER JOIN project_members pm ON pm.member_id = m.id
     WHERE pm.project_id = $1
     ORDER BY m.name ASC`,
    [project_id]
  )
}

export async function createMember(name: string, role_id: string, email: string | null = null): Promise<Member> {
  const db = await getDB()
  const existing = await db.select<Member[]>(
    'SELECT id FROM members WHERE LOWER(name) = LOWER($1)', [name.trim()]
  )
  if (existing.length > 0) throw new Error(`Member "${name}" already exists.`)
  const id = crypto.randomUUID()
  await db.execute(
    'INSERT INTO members (id, name, role_id, email) VALUES ($1, $2, $3, $4)',
    [id, name.trim(), role_id, email]
  )
  return { id, name: name.trim(), role_id, email, created_at: new Date().toISOString() }
}

export async function updateMember(id: string, fields: Partial<Pick<Member, 'name' | 'role_id' | 'email'>>): Promise<void> {
  const db = await getDB()
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return
  const set = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ')
  const values = [...entries.map(([, v]) => v), id]
  await db.execute(`UPDATE members SET ${set} WHERE id = $${entries.length + 1}`, values)
}

export async function deleteMember(id: string): Promise<void> {
  const db = await getDB()
  await db.execute('DELETE FROM members WHERE id = $1', [id])
}

export async function addMemberToProject(project_id: string, member_id: string): Promise<void> {
  const db = await getDB()
  await db.execute(
    'INSERT OR IGNORE INTO project_members (id, project_id, member_id) VALUES ($1, $2, $3)',
    [crypto.randomUUID(), project_id, member_id]
  )
}

export async function removeMemberFromProject(project_id: string, member_id: string): Promise<void> {
  const db = await getDB()
  await db.execute(
    'DELETE FROM project_members WHERE project_id = $1 AND member_id = $2',
    [project_id, member_id]
  )
}