import { getDB } from './db'

export type Moscow = 'must' | 'should' | 'could' | 'wont'

export interface Requirement {
    id: string
    project_id: string
    sprint_id: string | null
    name: string
    hours: number
    moscow: Moscow
    created_at: string
    converted_to_task: boolean
}

export async function getRequirements(project_id: string): Promise<Requirement[]> {
    const db = await getDB()
    return db.select(
        'SELECT * FROM requirements WHERE project_id = $1 ORDER BY created_at ASC',
        [project_id]
    )
}

export async function createRequirement(project_id: string, name: string): Promise<Requirement> {
    const db = await getDB()
    const id = crypto.randomUUID()
    await db.execute(
        'INSERT INTO requirements (id, project_id, name) VALUES ($1, $2, $3)',
        [id, project_id, name]
    )
    return { id, project_id, sprint_id: null, name, hours: 0, moscow: 'should', converted_to_task: false, created_at: new Date().toISOString() }
}

export async function updateRequirement(
    id: string,
    fields: Partial<Pick<Requirement, 'name' | 'hours' | 'moscow' | 'sprint_id' | 'converted_to_task'>>
): Promise<void> {
    const db = await getDB()
    const entries = Object.entries(fields).filter(([, v]) => v !== undefined)
    if (entries.length === 0) return
    const set = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ')
    const values = [...entries.map(([, v]) => v), id]
    await db.execute(`UPDATE requirements SET ${set} WHERE id = $${entries.length + 1}`, values)
}

export async function deleteRequirement(id: string): Promise<void> {
    const db = await getDB()
    await db.execute('DELETE FROM requirements WHERE id = $1', [id])
}

export async function requirementToTask(req: Requirement): Promise<void> {
    if (!req.sprint_id) throw new Error('Assign a sprint before converting to task.')
    const db = await getDB()
    const id = crypto.randomUUID()
    const result = await db.select<{ count: number }[]>(
        'SELECT COUNT(*) as count FROM tasks WHERE sprint_id = $1', [req.sprint_id]
    )
    const position = result[0]?.count ?? 0
    await db.execute(
        'INSERT INTO tasks (id, sprint_id, title, story_points, position) VALUES ($1, $2, $3, $4, $5)',
        [id, req.sprint_id, req.name, req.hours, position]
    )
    await db.execute('UPDATE requirements SET converted_to_task = 1 WHERE id = $1', [req.id])
}