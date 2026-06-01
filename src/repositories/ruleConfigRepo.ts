import { getDatabase } from '../db/database';
import { RuleConfig, RuleConfigCreate, RuleConfigUpdate } from '../models/ruleConfig';

export class RuleConfigRepo {
  private get db() {
    return getDatabase();
  }

  findAll(): RuleConfig[] {
    return this.db.prepare('SELECT * FROM rule_config ORDER BY id DESC').all() as RuleConfig[];
  }

  findById(id: number): RuleConfig | undefined {
    return this.db.prepare('SELECT * FROM rule_config WHERE id = ?').get(id) as RuleConfig | undefined;
  }

  findByCode(code: string): RuleConfig | undefined {
    return this.db.prepare('SELECT * FROM rule_config WHERE code = ?').get(code) as RuleConfig | undefined;
  }

  create(data: RuleConfigCreate): RuleConfig {
    const stmt = this.db.prepare(`
      INSERT INTO rule_config (code, name, status, responsible_person, rule_type, rule_value, threshold, batch_no, remark)
      VALUES (@code, @name, @status, @responsible_person, @rule_type, @rule_value, @threshold, @batch_no, @remark)
    `);
    const result = stmt.run(data);
    return this.findById(result.lastInsertRowid as number)!;
  }

  update(id: number, data: RuleConfigUpdate): RuleConfig {
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
    this.db.prepare(`UPDATE rule_config SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    return this.findById(id)!;
  }

  delete(id: number): boolean {
    const result = this.db.prepare('DELETE FROM rule_config WHERE id = ?').run(id);
    return result.changes > 0;
  }

  findByRuleType(ruleType: string): RuleConfig[] {
    return this.db.prepare('SELECT * FROM rule_config WHERE rule_type = ?').all(ruleType) as RuleConfig[];
  }

  findActive(): RuleConfig[] {
    return this.db.prepare("SELECT * FROM rule_config WHERE status = 'confirmed'").all() as RuleConfig[];
  }
}
