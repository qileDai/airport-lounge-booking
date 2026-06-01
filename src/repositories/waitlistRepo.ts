import { Waitlist, WaitlistCreate, WaitlistUpdate } from '../models/waitlist';
import { queryAll, queryOne, insertAndGetId, runChanges } from '../utils/dbHelper';

export class WaitlistRepo {
  findAll(): Waitlist[] {
    return queryAll<Waitlist>('SELECT * FROM waitlist ORDER BY priority_score DESC, id ASC');
  }

  findById(id: number): Waitlist | undefined {
    return queryOne<Waitlist>('SELECT * FROM waitlist WHERE id = ?', [id]);
  }

  findByCode(code: string): Waitlist | undefined {
    return queryOne<Waitlist>('SELECT * FROM waitlist WHERE code = ?', [code]);
  }

  create(data: WaitlistCreate): Waitlist {
    const id = insertAndGetId(
      `INSERT INTO waitlist (code, name, status, responsible_person, member_benefit_id, flight_slot_id, wait_start_time, priority_score, batch_no, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.code, data.name, data.status, data.responsible_person, data.member_benefit_id, data.flight_slot_id, data.wait_start_time, data.priority_score, data.batch_no, data.remark]
    );
    return this.findById(id)!;
  }

  update(id: number, data: WaitlistUpdate): Waitlist {
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
    runChanges(`UPDATE waitlist SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id)!;
  }

  delete(id: number): boolean {
    return runChanges('DELETE FROM waitlist WHERE id = ?', [id]) > 0;
  }

  findWaiting(): Waitlist[] {
    return queryAll<Waitlist>("SELECT * FROM waitlist WHERE status = 'waiting' ORDER BY priority_score DESC, wait_start_time ASC");
  }

  findByFlightSlotId(flightSlotId: number): Waitlist[] {
    return queryAll<Waitlist>('SELECT * FROM waitlist WHERE flight_slot_id = ? ORDER BY priority_score DESC', [flightSlotId]);
  }

  countTransferred(): number {
    const row = queryOne<any>("SELECT COUNT(*) as cnt FROM waitlist WHERE status = 'transferred'");
    return row ? row.cnt : 0;
  }

  countTotal(): number {
    const row = queryOne<any>('SELECT COUNT(*) as cnt FROM waitlist');
    return row ? row.cnt : 0;
  }
}
