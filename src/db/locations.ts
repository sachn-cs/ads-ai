import { getDb } from './client';
import { randomUUID } from 'node:crypto';
import { takeSnapshot } from './versions';

export interface Location {
  id: string;
  productionId: string;
  name: string;
  weather: string | null;
  timeOfDay: string | null;
  texture: string | null;
  architecture: string | null;
  props: string[];
  spatialDensity: string | null;
  backgroundActivity: string | null;
  atmosphere: string | null;
  colorBehavior: string | null;
  depthCues: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface LocationCreateInput {
  productionId: string;
  name: string;
  weather?: string;
  timeOfDay?: string;
  texture?: string;
  architecture?: string;
  props?: string[];
  spatialDensity?: string;
  backgroundActivity?: string;
  atmosphere?: string;
  colorBehavior?: string;
  depthCues?: string;
}

interface LocationRow {
  id: string;
  production_id: string;
  name: string;
  weather: string | null;
  time_of_day: string | null;
  texture: string | null;
  architecture: string | null;
  props_json: string;
  spatial_density: string | null;
  background_activity: string | null;
  atmosphere: string | null;
  color_behavior: string | null;
  depth_cues: string | null;
  created_at: string;
  updated_at: string;
}

function rowToLocation(r: LocationRow): Location {
  return {
    id: r.id,
    productionId: r.production_id,
    name: r.name,
    weather: r.weather,
    timeOfDay: r.time_of_day,
    texture: r.texture,
    architecture: r.architecture,
    props: safeParseJsonArray(r.props_json),
    spatialDensity: r.spatial_density,
    backgroundActivity: r.background_activity,
    atmosphere: r.atmosphere,
    colorBehavior: r.color_behavior,
    depthCues: r.depth_cues,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function safeParseJsonArray(s: string): string[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

export function listLocations(productionId: string): Location[] {
  const db = getDb();
  const rows = db
    .prepare(`SELECT * FROM locations WHERE production_id = ? ORDER BY name ASC`)
    .all(productionId) as LocationRow[];
  return rows.map(rowToLocation);
}

export function getLocation(id: string): Location | null {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM locations WHERE id = ?`).get(id) as LocationRow | undefined;
  return row ? rowToLocation(row) : null;
}

export function createLocation(input: LocationCreateInput, createdBy?: string): Location {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomUUID();
  db.prepare(
    `INSERT INTO locations
     (id, production_id, name, weather, time_of_day, texture, architecture, props_json,
      spatial_density, background_activity, atmosphere, color_behavior, depth_cues,
      created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.productionId,
    input.name,
    input.weather ?? null,
    input.timeOfDay ?? null,
    input.texture ?? null,
    input.architecture ?? null,
    JSON.stringify(input.props ?? []),
    input.spatialDensity ?? null,
    input.backgroundActivity ?? null,
    input.atmosphere ?? null,
    input.colorBehavior ?? null,
    input.depthCues ?? null,
    now,
    now,
  );
  const l = getLocation(id)!;
  takeSnapshot('location', id, l, createdBy, undefined, input.productionId);
  return l;
}

export function updateLocation(
  id: string,
  patch: Partial<LocationCreateInput>,
  updatedBy?: string,
): Location {
  const db = getDb();
  const existing = getLocation(id);
  if (!existing) throw new Error(`Location ${id} not found`);
  const merged: Location = { ...existing, ...patch, props: patch.props ?? existing.props };
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE locations SET
      name = ?, weather = ?, time_of_day = ?, texture = ?, architecture = ?,
      props_json = ?, spatial_density = ?, background_activity = ?, atmosphere = ?,
      color_behavior = ?, depth_cues = ?, updated_at = ?
     WHERE id = ?`,
  ).run(
    merged.name,
    merged.weather,
    merged.timeOfDay,
    merged.texture,
    merged.architecture,
    JSON.stringify(merged.props),
    merged.spatialDensity,
    merged.backgroundActivity,
    merged.atmosphere,
    merged.colorBehavior,
    merged.depthCues,
    now,
    id,
  );
  const updated = getLocation(id)!;
  takeSnapshot('location', id, updated, updatedBy, undefined, existing.productionId);
  return updated;
}

export function deleteLocation(id: string): void {
  const db = getDb();
  db.prepare(`DELETE FROM locations WHERE id = ?`).run(id);
}
