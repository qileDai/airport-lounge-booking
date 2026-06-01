import { getDatabaseSync } from '../db/database';

export function queryAll<T = any>(sql: string, params?: any[]): T[] {
  const db = getDatabaseSync();
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  const results: T[] = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject() as T);
  }
  stmt.free();
  return results;
}

export function queryOne<T = any>(sql: string, params?: any[]): T | undefined {
  const db = getDatabaseSync();
  const stmt = db.prepare(sql);
  if (params) stmt.bind(params);
  let result: T | undefined;
  if (stmt.step()) {
    result = stmt.getAsObject() as T;
  }
  stmt.free();
  return result;
}

export function runSql(sql: string, params?: any[]): void {
  const db = getDatabaseSync();
  if (params) {
    db.run(sql, params);
  } else {
    db.run(sql);
  }
}

export function insertAndGetId(sql: string, params: any[]): number {
  const db = getDatabaseSync();
  db.run(sql, params);
  const stmt = db.prepare('SELECT last_insert_rowid() as id');
  let id = 0;
  if (stmt.step()) {
    id = (stmt.getAsObject() as any).id as number;
  }
  stmt.free();
  return id;
}

export function runChanges(sql: string, params?: any[]): number {
  const db = getDatabaseSync();
  db.run(sql, params || []);
  return db.getRowsModified();
}
