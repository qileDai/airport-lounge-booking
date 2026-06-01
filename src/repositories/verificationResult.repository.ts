import { getDatabase, saveDatabase } from '../db/database';
import { IVerificationResult } from '../models/entities';

export class VerificationResultRepository {
  async findAll(page = 1, limit = 10): Promise<{ data: IVerificationResult[]; total: number }> {
    const db = await getDatabase();
    const offset = (page - 1) * limit;
    
    const countResult = db.exec('SELECT COUNT(*) as total FROM verification_results');
    const total = countResult[0]?.values[0][0] as number || 0;
    
    const result = db.exec(
      `SELECT * FROM verification_results ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    
    return { data: this.mapResults(result), total };
  }

  async findById(id: string): Promise<IVerificationResult | null> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM verification_results WHERE id = ?', [id]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async findByMemberId(memberId: string): Promise<IVerificationResult[]> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM verification_results WHERE member_id = ?', [memberId]);
    return this.mapResults(result);
  }

  async create(data: Omit<IVerificationResult, 'id' | 'created_at' | 'updated_at'>): Promise<IVerificationResult> {
    const db = await getDatabase();
    const id = `VR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO verification_results (id, code, name, member_id, booking_id, verification_type, result, score, rule_violations, exception_flags, status, reviewer_name, review_time, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.code, data.name, data.member_id, data.booking_id, data.verification_type,
       data.result, data.score || 0, data.rule_violations, data.exception_flags,
       data.status || 'pending_review', data.reviewer_name, data.review_time,
       data.owner_name, data.batch_id, data.remark, now, now]
    );
    
    await saveDatabase();
    return this.findById(id) as Promise<IVerificationResult>;
  }

  async update(id: string, data: Partial<IVerificationResult>): Promise<IVerificationResult | null> {
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
    
    db.run(`UPDATE verification_results SET ${fields.join(', ')} WHERE id = ?`, values);
    await saveDatabase();
    
    return this.findById(id);
  }

  async getStatistics(): Promise<{
    total: number;
    passed: number;
    failed: number;
    warning: number;
    passRate: number
  }> {
    const db = await getDatabase();
    
    const totalResult = db.exec('SELECT COUNT(*) as count FROM verification_results');
    const passedResult = db.exec("SELECT COUNT(*) as count FROM verification_results WHERE result = 'passed'");
    const failedResult = db.exec("SELECT COUNT(*) as count FROM verification_results WHERE result = 'failed'");
    const warningResult = db.exec("SELECT COUNT(*) as count FROM verification_results WHERE result = 'warning'");
    
    const total = totalResult[0]?.values[0][0] as number || 0;
    const passed = passedResult[0]?.values[0][0] as number || 0;
    const failed = failedResult[0]?.values[0][0] as number || 0;
    const warning = warningResult[0]?.values[0][0] as number || 0;
    
    return {
      total,
      passed,
      failed,
      warning,
      passRate: total > 0 ? (passed / total) * 100 : 0
    };
  }

  private mapResults(result: any[]): IVerificationResult[] {
    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        obj[col] = row[i];
      });
      return obj as IVerificationResult;
    });
  }
}
