import { getDB } from './db'

export type DailyScrumStatus = 'scheduled' | 'completed' | 'cancelled'

export interface DailyScrum {
  id: string
  project_id: string
  sprint_id: string | null
  title: string
  scheduled_at: string
  duration_minutes: number
  location: string | null
  content: string
  status: DailyScrumStatus
  created_at: string
}

export interface DailyScrumMember {
  id: string
  daily_scrum_id: string
  member_id: string
  email: string
}

export async function getDailyScrums(project_id: string): Promise<DailyScrum[]> {
  const db = await getDB()
  return db.select(
    'SELECT * FROM daily_scrums WHERE project_id = $1 ORDER BY scheduled_at DESC',
    [project_id]
  )
}

export async function getDailyScrumMembers(daily_scrum_id: string): Promise<DailyScrumMember[]> {
  const db = await getDB()
  return db.select(
    'SELECT * FROM daily_scrum_members WHERE daily_scrum_id = $1',
    [daily_scrum_id]
  )
}

export async function createDailyScrum(
  project_id: string,
  sprint_id: string | null,
  title: string,
  scheduled_at: string,
  duration_minutes: number,
  location: string | null,
  member_emails: { member_id: string; email: string }[]
): Promise<DailyScrum> {
  const db = await getDB()
  const id = crypto.randomUUID()
  await db.execute(
    `INSERT INTO daily_scrums (id, project_id, sprint_id, title, scheduled_at, duration_minutes, location)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [id, project_id, sprint_id, title, scheduled_at, duration_minutes, location]
  )
  for (const me of member_emails) {
    await db.execute(
      'INSERT INTO daily_scrum_members (id, daily_scrum_id, member_id, email) VALUES ($1, $2, $3, $4)',
      [crypto.randomUUID(), id, me.member_id, me.email]
    )
  }
  return {
    id, project_id, sprint_id, title, scheduled_at,
    duration_minutes, location, content: '', status: 'scheduled',
    created_at: new Date().toISOString(),
  }
}

export async function updateDailyScrum(
  id: string,
  fields: Partial<Pick<DailyScrum, 'title' | 'scheduled_at' | 'duration_minutes' | 'location' | 'content' | 'status'>>
): Promise<void> {
  const db = await getDB()
  const entries = Object.entries(fields).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return
  const set = entries.map(([k], i) => `${k} = $${i + 1}`).join(', ')
  const values = [...entries.map(([, v]) => v), id]
  await db.execute(`UPDATE daily_scrums SET ${set} WHERE id = $${entries.length + 1}`, values)
}

export async function deleteDailyScrum(id: string): Promise<void> {
  const db = await getDB()
  await db.execute('DELETE FROM daily_scrums WHERE id = $1', [id])
}