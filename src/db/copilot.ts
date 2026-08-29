import { getDb } from './client';
import { randomUUID } from 'node:crypto';

export interface CopilotThread {
  id: string;
  productionId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface CopilotMessage {
  id: number;
  threadId: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  citations: CopilotCitation[];
  agentId: string | null;
  createdAt: string;
}

export interface CopilotCitation {
  entityType: 'character' | 'scene' | 'shot' | 'location' | 'continuity' | 'knowledge' | 'asset';
  entityId: string;
  label: string;
  href?: string;
}

export interface CopilotMessageCreateInput {
  threadId: string;
  role: CopilotMessage['role'];
  content: string;
  citations?: CopilotCitation[];
  agentId?: string;
}

interface ThreadRow {
  id: string;
  production_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

interface MessageRow {
  id: number;
  thread_id: string;
  role: string;
  content: string;
  citations_json: string;
  agent_id: string | null;
  created_at: string;
}

function rowToThread(r: ThreadRow): CopilotThread {
  return {
    id: r.id,
    productionId: r.production_id,
    title: r.title,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function rowToMessage(r: MessageRow): CopilotMessage {
  return {
    id: r.id,
    threadId: r.thread_id,
    role: r.role as CopilotMessage['role'],
    content: r.content,
    citations: safeParseCitations(r.citations_json),
    agentId: r.agent_id,
    createdAt: r.created_at,
  };
}

function safeParseCitations(s: string): CopilotCitation[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? (v as CopilotCitation[]) : [];
  } catch {
    return [];
  }
}

export function listThreads(productionId: string): CopilotThread[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT * FROM copilot_threads WHERE production_id = ? ORDER BY updated_at DESC`,
    )
    .all(productionId) as ThreadRow[];
  return rows.map(rowToThread);
}

export function createThread(productionId: string, title: string): CopilotThread {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO copilot_threads (id, production_id, title, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, productionId, title, now, now);
  return getThread(id)!;
}

export function getThread(id: string): CopilotThread | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM copilot_threads WHERE id = ?`)
    .get(id) as ThreadRow | undefined;
  return row ? rowToThread(row) : null;
}

export function touchThread(id: string): void {
  const db = getDb();
  db.prepare(`UPDATE copilot_threads SET updated_at = ? WHERE id = ?`).run(
    new Date().toISOString(),
    id,
  );
}

export function listMessages(threadId: string): CopilotMessage[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM copilot_messages WHERE thread_id = ? ORDER BY created_at ASC, id ASC`)
    .all(threadId) as MessageRow[];
  return rows.map(rowToMessage);
}

export function appendMessage(input: CopilotMessageCreateInput): CopilotMessage {
  const db = getDb();
  const now = new Date().toISOString();
  const info = db
    .prepare(
      `INSERT INTO copilot_messages (thread_id, role, content, citations_json, agent_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      input.threadId,
      input.role,
      input.content,
      JSON.stringify(input.citations ?? []),
      input.agentId ?? null,
      now,
    );
  touchThread(input.threadId);
  return getMessage(Number(info.lastInsertRowid))!;
}

export function getMessage(id: number): CopilotMessage | null {
  const db = getDb();
  const row = db
    .prepare(`SELECT * FROM copilot_messages WHERE id = ?`)
    .get(id) as MessageRow | undefined;
  return row ? rowToMessage(row) : null;
}

export function deleteThread(id: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM copilot_threads WHERE id = ?`).run(id);
}
