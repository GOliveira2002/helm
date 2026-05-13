import { getDB } from './db'

export interface Role {
  id: string
  name: string
  created_at: string
}

export async function getRoles(): Promise<Role[]> {
  const db = await getDB()
  return db.select('SELECT * FROM roles ORDER BY name ASC')
}

export async function createRole(name: string): Promise<Role> {
  const db = await getDB()
  const existing = await db.select<Role[]>(
    'SELECT id FROM roles WHERE LOWER(name) = LOWER($1)', [name.trim()]
  )
  if (existing.length > 0) throw new Error(`Role "${name}" already exists.`)
  const id = crypto.randomUUID()
  await db.execute('INSERT INTO roles (id, name) VALUES ($1, $2)', [id, name.trim()])
  return { id, name: name.trim(), created_at: new Date().toISOString() }
}

export async function updateRole(id: string, name: string): Promise<void> {
  const db = await getDB()
  await db.execute('UPDATE roles SET name = $1 WHERE id = $2', [name.trim(), id])
}

export async function deleteRole(id: string): Promise<void> {
  const db = await getDB()
  await db.execute('DELETE FROM roles WHERE id = $1', [id])
}