import { getDatabase, saveDatabase } from '../db/database';
import { IFlightPeriod } from '../models/entities';

export class FlightPeriodRepository {
  async findAll(page = 1, limit = 10): Promise<{ data: IFlightPeriod[]; total: number }> {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    const countResult = db.exec('SELECT COUNT(*) as total FROM flight_periods');
    const total = countResult[0]?.values[0][0] as number || 0;
    
    const result = db.exec(
      `SELECT * FROM flight_periods ORDER BY departure_time ASC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return { data: this.mapResults(result), total };
  }

  async findById(id: string): Promise<IFlightPeriod | null> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM flight_periods WHERE id = ?', [id]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async create(data: Omit<IFlightPeriod, 'id' | 'created_at' | 'updated_at'>): Promise<IFlightPeriod> {
    const db = await getDatabase();
    const id = `FP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO flight_periods (id, code, name, flight_number, departure_time, arrival_time, airport_code, terminal, status, capacity, used_count, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.code, data.name, data.flight_number, data.departure_time, data.arrival_time,
       data.airport_code, data.terminal, data.status || 'scheduled', data.capacity || 50,
       data.used_count || 0, data.owner_name, data.batch_id, data.remark, now, now]
    );
    
    await saveDatabase();
    return this.findById(id) as Promise<IFlightPeriod>;
  }

  async update(id: string, data: Partial<IFlightPeriod>): Promise<IFlightPeriod | null> {
    const db = await getDatabase();
    const existing = await this.findById(id);
    if (!existing) return null;
    
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    
    if (fields.length === 0) return existing;
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    db.run(`UPDATE flight_periods SET ${fields.join(', ')} WHERE id = ?`, values);
    await saveDatabase();
    
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const db = await getDatabase();
    db.run('DELETE FROM flight_periods WHERE id = ?', [id]);
    await saveDatabase();
    return true;
  }

  async archiveByDate(beforeDate: string): Promise<number> {
    const db = await getDatabase();
    db.run(
      "UPDATE flight_periods SET status = 'archived', updated_at = ? WHERE departure_time < ? AND status != 'archived'",
      [new Date().toISOString(), beforeDate]
    );
    await saveDatabase();
    
    const result = db.exec('SELECT changes()');
    return result[0]?.values[0][0] as number || 0;
  }

  private mapResults(result: any[]): IFlightPeriod[] {
    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as IFlightPeriod;
    });
  }
}
