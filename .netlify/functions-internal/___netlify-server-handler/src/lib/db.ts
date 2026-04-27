import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'mission-control.db');

let db: Database.Database | null = null;

function getDataDir(): string {
  // Use /tmp for writable storage in serverless environments
  return process.env.DATABASE_DIR || (process.env.NODE_ENV === 'production' ? '/tmp/abacus-mc-data' : path.join(process.cwd(), 'data'));
}

export function getDb(): Database.Database {
  if (!db) {
    // Ensure data directory exists
    const fs = require('fs');
    const dataDir = getDataDir();
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    const dbPath = path.join(dataDir, 'mission-control.db');
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    initializeSchema(db);
  }
  return db;
}

function initializeSchema(database: Database.Database): void {
  // Create agent_definitions table if it doesn't exist
  database.exec(`
    CREATE TABLE IF NOT EXISTS agent_definitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create tasks table (no FK on agent_slug — agents can be ad-hoc)
  database.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      agent_slug TEXT NOT NULL,
      task TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      result TEXT,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT
    )
  `);

  // Create index on tasks status
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status)
  `);

  // Create index on tasks agent_slug
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_tasks_agent_slug ON tasks(agent_slug)
  `);

  // Create activity_log table
  database.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      agent_slug TEXT,
      task_id TEXT,
      message TEXT NOT NULL,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Create index on activity_log
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_activity_created ON activity_log(created_at DESC)
  `);

  // Create conversations table for chat interface
  database.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      agent_slug TEXT NOT NULL,
      title TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (agent_slug) REFERENCES agent_definitions(slug)
    )
  `);

  // Create messages table for chat
  database.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    )
  `);

  // Create index on messages
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id)
  `);
}

// Agent definitions
export interface AgentDefinition {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  content: string;
  created_at: string;
  updated_at: string;
}

export function getAgentBySlug(slug: string): AgentDefinition | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM agent_definitions WHERE slug = ?');
  return stmt.get(slug) as AgentDefinition | undefined;
}

export function getAllAgents(): AgentDefinition[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM agent_definitions ORDER BY name');
  return stmt.all() as AgentDefinition[];
}

export function upsertAgent(slug: string, name: string, description: string | null, content: string): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO agent_definitions (slug, name, description, content, updated_at)
    VALUES (?, ?, ?, ?, datetime('now'))
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      content = excluded.content,
      updated_at = datetime('now')
  `);
  stmt.run(slug, name, description, content);
}

// Tasks
export interface Task {
  id: string;
  agent_slug: string;
  task: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function createTask(id: string, agentSlug: string, task: string): Task {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO tasks (id, agent_slug, task, status)
    VALUES (?, ?, ?, 'pending')
  `);
  stmt.run(id, agentSlug, task);
  return getTaskById(id)!;
}

export function getTaskById(id: string): Task | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return stmt.get(id) as Task | undefined;
}

export function getAllTasks(): Task[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
  return stmt.all() as Task[];
}

export function updateTaskStatus(id: string, status: Task['status'], result?: string, error?: string): void {
  const db = getDb();
  if (status === 'completed' || status === 'failed') {
    const stmt = db.prepare(`
      UPDATE tasks 
      SET status = ?, result = ?, error = ?, updated_at = datetime('now'), completed_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(status, result ?? null, error ?? null, id);
  } else {
    const stmt = db.prepare(`
      UPDATE tasks 
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `);
    stmt.run(status, id);
  }
}

// Activity Log
export interface ActivityLogEntry {
  id: number;
  event_type: string;
  agent_slug: string | null;
  task_id: string | null;
  message: string;
  metadata: string | null;
  created_at: string;
}

export function logActivity(eventType: string, message: string, agentSlug?: string, taskId?: string, metadata?: Record<string, unknown>): void {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO activity_log (event_type, agent_slug, task_id, message, metadata)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(eventType, agentSlug ?? null, taskId ?? null, message, metadata ? JSON.stringify(metadata) : null);
}

export function getRecentActivity(limit: number = 50): ActivityLogEntry[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM activity_log ORDER BY created_at DESC LIMIT ?');
  return stmt.all(limit) as ActivityLogEntry[];
}

export function getActivityByType(eventType: string, limit: number = 50): ActivityLogEntry[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM activity_log WHERE event_type = ? ORDER BY created_at DESC LIMIT ?');
  return stmt.all(eventType, limit) as ActivityLogEntry[];
}

// Conversations for chat
export interface Conversation {
  id: string;
  agent_slug: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export function createConversation(id: string, agentSlug: string, title?: string): Conversation {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO conversations (id, agent_slug, title)
    VALUES (?, ?, ?)
  `);
  stmt.run(id, agentSlug, title ?? null);
  return getConversationById(id)!;
}

export function getConversationById(id: string): Conversation | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM conversations WHERE id = ?');
  return stmt.get(id) as Conversation | undefined;
}

export function getAllConversations(): Conversation[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM conversations ORDER BY updated_at DESC');
  return stmt.all() as Conversation[];
}

export function getConversationsByAgent(agentSlug: string): Conversation[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM conversations WHERE agent_slug = ? ORDER BY updated_at DESC');
  return stmt.all(agentSlug) as Conversation[];
}

export function updateConversationTimestamp(id: string): void {
  const db = getDb();
  const stmt = db.prepare('UPDATE conversations SET updated_at = datetime("now") WHERE id = ?');
  stmt.run(id);
}

export function deleteConversation(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM messages WHERE conversation_id = ?').run(id);
  db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
}

export function createMessage(id: string, conversationId: string, role: Message['role'], content: string): Message {
  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, conversationId, role, content);
  updateConversationTimestamp(conversationId);
  return getMessageById(id)!;
}

export function getMessageById(id: string): Message | undefined {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM messages WHERE id = ?');
  return stmt.get(id) as Message | undefined;
}

export function getMessagesByConversation(conversationId: string): Message[] {
  const db = getDb();
  const stmt = db.prepare('SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC');
  return stmt.all(conversationId) as Message[];
}

export function deleteMessage(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM messages WHERE id = ?').run(id);
}
