import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null
let initPromise: Promise<Database> | null = null

export async function getDB(): Promise<Database> {
  if (db) return db
  if (initPromise) return initPromise

  initPromise = Database.load('sqlite:helm.db').then(async (database) => {

    // ─── Schema ───────────────────────────────────────────────────────────────

    await database.execute(`
      CREATE TABLE IF NOT EXISTS roles (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT DEFAULT NULL,
        role_id TEXT REFERENCES roles(id) ON DELETE SET NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#6366f1',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS project_members (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
        UNIQUE(project_id, member_id)
      );

      CREATE TABLE IF NOT EXISTS sprints (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT DEFAULT '',
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'planned',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        sprint_id TEXT REFERENCES sprints(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        assignee_id TEXT REFERENCES members(id) ON DELETE SET NULL,
        start_date TEXT DEFAULT NULL,
        due_date TEXT DEFAULT NULL,
        completed_at TEXT DEFAULT NULL,
        story_points INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS requirements (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
        name TEXT NOT NULL,
        hours INTEGER DEFAULT 0,
        moscow TEXT DEFAULT 'could',
        converted INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS daily_scrums (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        sprint_id TEXT REFERENCES sprints(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        scheduled_at TEXT NOT NULL,
        duration_minutes INTEGER DEFAULT 30,
        location TEXT DEFAULT NULL,
        content TEXT DEFAULT '',
        status TEXT DEFAULT 'scheduled',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS daily_scrum_members (
        id TEXT PRIMARY KEY,
        daily_scrum_id TEXT REFERENCES daily_scrums(id) ON DELETE CASCADE,
        member_id TEXT REFERENCES members(id) ON DELETE CASCADE,
        email TEXT NOT NULL
      );
    `)

    // ─── Seed: default roles ──────────────────────────────────────────────────

    const rolesCount = await database.select<{ count: number }[]>(
      `SELECT COUNT(*) as count FROM roles`
    )
    if (rolesCount[0]?.count === 0) {
      await database.execute(`
        INSERT INTO roles (id, name) VALUES
          ('${crypto.randomUUID()}', 'Scrum Master'),
          ('${crypto.randomUUID()}', 'Product Owner'),
          ('${crypto.randomUUID()}', 'Developer'),
          ('${crypto.randomUUID()}', 'Viewer')
      `)
    }

    db = database
    return database
  })

  return initPromise
}

export function resetDBCache() {
  db = null
  initPromise = null
}