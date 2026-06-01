import { FlightSlot, FlightSlotCreate, FlightSlotUpdate } from '../models/flightSlot';
import { queryAll, queryOne, insertAndGetId, runChanges } from '../utils/dbHelper';

export class FlightSlotRepo {
  findAll(): FlightSlot[] {
    return queryAll<FlightSlot>('SELECT * FROM flight_slot ORDER BY id DESC');
  }

  findById(id: number): FlightSlot | undefined {
    return queryOne<FlightSlot>('SELECT * FROM flight_slot WHERE id = ?', [id]);
  }

  findByCode(code: string): FlightSlot | undefined {
    return queryOne<FlightSlot>('SELECT * FROM flight_slot WHERE code = ?', [code]);
  }

  create(data: FlightSlotCreate): FlightSlot {
    const id = insertAndGetId(
      `INSERT INTO flight_slot (code, name, status, responsible_person, airport_code, flight_number, departure_time, arrival_time, capacity, used_count, is_archived, snapshot_data, batch_no, remark)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.code, data.name, data.status, data.responsible_person, data.airport_code, data.flight_number, data.departure_time, data.arrival_time, data.capacity, data.used_count, data.is_archived, data.snapshot_data, data.batch_no, data.remark]
    );
    return this.findById(id)!;
  }

  update(id: number, data: FlightSlotUpdate): FlightSlot {
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
    runChanges(`UPDATE flight_slot SET ${fields.join(', ')} WHERE id = ?`, values);
    return this.findById(id)!;
  }

  delete(id: number): boolean {
    return runChanges('DELETE FROM flight_slot WHERE id = ?', [id]) > 0;
  }

  findActive(): FlightSlot[] {
    return queryAll<FlightSlot>("SELECT * FROM flight_slot WHERE is_archived = 0 ORDER BY departure_time ASC");
  }

  findArchived(): FlightSlot[] {
    return queryAll<FlightSlot>("SELECT * FROM flight_slot WHERE is_archived = 1 ORDER BY id DESC");
  }

  archive(id: number): FlightSlot {
    return this.update(id, { is_archived: 1, status: 'archived' } as FlightSlotUpdate);
  }

  snapshot(id: number): FlightSlot {
    const slot = this.findById(id);
    if (!slot) throw new Error('FlightSlot not found');
    const snapshotData = JSON.stringify(slot);
    return this.update(id, { snapshot_data: snapshotData } as FlightSlotUpdate);
  }
}
