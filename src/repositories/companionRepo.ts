import { Companion, CompanionCreate, CompanionUpdate } from '../models/companion';
import { queryAll, queryOne, insertAndGetId, runChanges } from '../utils/dbHelper';

export class CompanionRepo {
  findAll(): Companion[] {
    return queryAll<Companion>('SELECT * FROM companion ORDER BY id DESC');
  }

  findById(id: number): Companion | undefined {
    return queryOne<Companion>('SELECT * FROM companion WHERE id = ?', [id]);
  }

  findByCode(code: string): Companion | undefined {
    return queryOne<Companion>('SELECT * FROM companion WHERE code = ?', [code]);
  }

  create(data: CompanionCreate): Companion {
    const id = insertAndGetId(
      `INSERT INTO companion (code, name, status, responsible_person, reservation_id, relationship, id_number, batch_no, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.code, data.name, data.status, data.responsible_person, data.reservation_id, data.relationship, data.id_number, data.batch_no, data.remark]
    );
    return this.findById(id)!;
  }

  update(id: number, data: CompanionUpdate): Companion {
    const fields: string[] = [];
    const values: any[] = [];
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    if (fields.length === 0) return this.findById(id)!;
    fields.push("updated_at = datetime('now', 'localtime')");
    values.push(id);
    runChanges(`UPDATE companion SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id)!;
  }

  delete(id: number): boolean {
    return runChanges('DELETE FROM companion WHERE id = ?', [id]) > 0;
  }

  findByReservationId(reservationId: number): Companion[] {
    return queryAll<Companion>('SELECT * FROM companion WHERE reservation_id = ?', [reservationId]);
  }

  countByReservationId(reservationId: number): number {
    const row = queryOne<any>('SELECT COUNT(*) as cnt FROM companion WHERE reservation_id = ?', [reservationId]);
    return row ? row.cnt : 0;
  }
}
