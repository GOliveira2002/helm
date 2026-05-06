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
        story_points INTEGER DEFAULT 0,
        position INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `)
    db = database
    return database
  })

  return initPromise
}