import Database from '@tauri-apps/plugin-sql'

let db: Database | null = null
let initPromise: Promise<Database> | null = null

export async function getDB(): Promise<Database> {
  if (db) return db
  if (initPromise) return initPromise

  initPromise = Database.load('sqlite:helm.db').then(async (database) => {
    await database.execute(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        color TEXT DEFAULT '#6366f1',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS members (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS sprints (
        id TEXT PRIMARY KEY,
        project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        start_date TEXT,
        end_date TEXT,
        status TEXT DEFAULT 'active',
        created_at TEXT DEFAULT (datetime('now'))
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        sprint_id TEXT REFERENCES sprints(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        status TEXT DEFAULT 'todo',
        priority TEXT DEFAULT 'medium',
        assignee_id TEXT REFERENCES members(id) ON DELETE SET NULL,
        due_date TEXT DEFAULT NULL,
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
        created_at TEXT DEFAULT (datetime('now')),
        converted_to_task BOOLEAN DEFAULT false
      )
    `)

    // Migrations — adiciona colunas se a DB já existia
    const taskColumns = await database.select<{ name: string }[]>(
      `PRAGMA table_info(tasks)`
    )
    const colNames = taskColumns.map(c => c.name)

    if (!colNames.includes('priority')) {
      await database.execute(`ALTER TABLE tasks ADD COLUMN priority TEXT DEFAULT 'medium'`)
    }
    if (!colNames.includes('assignee_id')) {
      await database.execute(`ALTER TABLE tasks ADD COLUMN assignee_id TEXT`)
    }
    if (!colNames.includes('due_date')) {
      await database.execute(`ALTER TABLE tasks ADD COLUMN due_date TEXT`)
    }
    if (!colNames.includes('notes')) {
      await database.execute(`ALTER TABLE tasks ADD COLUMN notes TEXT DEFAULT ''`)
    }
    if (!colNames.includes('completed_at')) {
      await database.execute(`ALTER TABLE tasks ADD COLUMN completed_at TEXT DEFAULT NULL`)
    }
    if (!colNames.includes('start_date')) {
      await database.execute(`ALTER TABLE tasks ADD COLUMN start_date TEXT DEFAULT NULL`)
    }
    const tableList = await database.select<{ name: string }[]>(
      `SELECT name FROM sqlite_master WHERE type='table' AND name='members'`
    )
    if (tableList.length === 0) {
      await database.execute(`CREATE TABLE members (
    id TEXT PRIMARY KEY,
    project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  )`)
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