import { Reservation, ReservationCreate, ReservationUpdate } from '../models/reservation';
import { queryAll, queryOne, insertAndGetId, runChanges, runSql } from '../utils/dbHelper';

export class ReservationRepo {
  findAll(): Reservation[] {
    return queryAll<Reservation>('SELECT * FROM reservation ORDER BY id DESC');
  }

  findById(id: number): Reservation | undefined {
    return queryOne<Reservation>('SELECT * FROM reservation WHERE id = ?', [id]);
  }

  findByCode(code: string): Reservation | undefined {
    return queryOne<Reservation>('SELECT * FROM reservation WHERE code = ?', [code]);
  }

  create(data: ReservationCreate): Reservation {
    const id = insertAndGetId(
      `INSERT INTO reservation (code, name, status, responsible_person, member_benefit_id, flight_slot_id, companion_count, batch_no, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.code, data.name, data.status, data.responsible_person, data.member_benefit_id, data.flight_slot_id, data.companion_count, data.batch_no, data.remark]
    );
    return this.findById(id)!;
  }

  update(id: number, data: ReservationUpdate): Reservation {
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
    runChanges(`UPDATE reservation SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id)!;
  }

  delete(id: number): boolean {
    return runChanges('DELETE FROM reservation WHERE id = ?', [id]) > 0;
  }

  findByMemberBenefitId(memberBenefitId: number): Reservation[] {
    return queryAll<Reservation>('SELECT * FROM reservation WHERE member_benefit_id = ?', [memberBenefitId]);
  }

  findByFlightSlotId(flightSlotId: number): Reservation[] {
    return queryAll<Reservation>('SELECT * FROM reservation WHERE flight_slot_id = ?', [flightSlotId]);
  }

  createMany(items: ReservationCreate[]): Reservation[] {
    const results: Reservation[] = [];
    for (const item of items) {
      const id = insertAndGetId(
        `INSERT INTO reservation (code, name, status, responsible_person, member_benefit_id, flight_slot_id, companion_count, batch_no, remark)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [item.code, item.name, item.status, item.responsible_person, item.member_benefit_id, item.flight_slot_id, item.companion_count, item.batch_no, item.remark]
      );
      results.push(this.findById(id)!);
    }
    return results;
  }
}
