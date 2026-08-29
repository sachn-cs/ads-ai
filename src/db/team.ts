import { getDb } from './client';
import { randomUUID } from 'node:crypto';

export type TeamRole = 'owner' | 'editor' | 'commenter';

export interface TeamMember {
  id: string;
  role: TeamRole;
  name: string;
  email: string | null;
  createdAt: string;
}

export interface Invite {
  id: string;
  productionId: string | null;
  token: string;
  role: TeamRole;
  createdBy: string;
  createdAt: string;
  expiresAt: string | null;
  acceptedAt: string | null;
}

interface MemberRow {
  id: string;
  role: string;
  name: string;
  email: string | null;
  created_at: string;
}

interface InviteRow {
  id: string;
  production_id: string | null;
  token: string;
  role: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
  accepted_at: string | null;
}

function rowToMember(r: MemberRow): TeamMember {
  return {
    id: r.id,
    role: r.role as TeamRole,
    name: r.name,
    email: r.email,
    createdAt: r.created_at,
  };
}

function rowToInvite(r: InviteRow): Invite {
  return {
    id: r.id,
    productionId: r.production_id,
    token: r.token,
    role: r.role as TeamRole,
    createdBy: r.created_by,
    createdAt: r.created_at,
    expiresAt: r.expires_at,
    acceptedAt: r.accepted_at,
  };
}

export function ensureDefaultOperator(): TeamMember {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM team_members LIMIT 1`).get() as MemberRow | undefined;
  if (existing) return rowToMember(existing);
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO team_members (id, role, name, email, created_at) VALUES (?, 'owner', 'Operator', NULL, ?)`,
  ).run(id, now);
  return { id, role: 'owner', name: 'Operator', email: null, createdAt: now };
}

export function listMembers(): TeamMember[] {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM team_members ORDER BY created_at ASC`).all() as MemberRow[];
  return rows.map(rowToMember);
}

export function listInvites(): Invite[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM invites ORDER BY created_at DESC`)
    .all() as InviteRow[];
  return rows.map(rowToInvite);
}

export function createInvite(
  role: TeamRole,
  createdBy: string,
  productionId: string | null = null,
  expiresAt: string | null = null,
): Invite {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  const token = randomUUID().replace(/-/g, '');
  db.prepare(
    `INSERT INTO invites (id, production_id, token, role, created_by, created_at, expires_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, productionId, token, role, createdBy, now, expiresAt);
  return getInvite(id)!;
}

export function getInvite(id: string): Invite | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM invites WHERE id = ?`).get(id) as InviteRow | undefined;
  return row ? rowToInvite(row) : null;
}

export function revokeInvite(id: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM invites WHERE id = ?`).run(id);
}

export function getRoleDefinitions(): { role: TeamRole; description: string }[] {
  return [
    { role: 'owner', description: 'Full control over productions, settings, and team.' },
    { role: 'editor', description: 'Create and edit characters, scenes, shots, wardrobe, locations.' },
    { role: 'commenter', description: 'Read everything; comment and react without editing.' },
  ];
}
