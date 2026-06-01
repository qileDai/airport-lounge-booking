import { getDatabase, saveDatabase } from '../db/database';
import { IRuleConfig } from '../models/entities';

export class RuleConfigRepository {
  async findAll(activeOnly = false): Promise<IRuleConfig[]> {
    const db = await getDatabase();
    
    if (activeOnly) {
      const result = db.exec('SELECT * FROM rule_configs WHERE is_active = 1 ORDER BY priority ASC');
      return this.mapResults(result);
    }
    
    const result = db.exec('SELECT * FROM rule_configs ORDER BY priority ASC');
    return this.mapResults(result);
  }

  async findById(id: string): Promise<IRuleConfig | null> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM rule_configs WHERE id = ?', [id]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async findByCategory(category: string): Promise<IRuleConfig[]> {
    const db = await getDatabase();
    const result = db.exec('SELECT * FROM rule_configs WHERE rule_category = ? AND is_active = 1 ORDER BY priority ASC', [category]);
    return this.mapResults(result);
  }

  async findByKey(key: string): Promise<IRuleConfig | null> {
    const db = await getDatabase();
    const result = db.exec("SELECT * FROM rule_configs WHERE rule_key = ? AND is_active = 1", [key]);
    const data = this.mapResults(result);
    return data[0] || null;
  }

  async create(data: Omit<IRuleConfig, 'id' | 'created_at' | 'updated_at'>): Promise<IRuleConfig> {
    const db = await getDatabase();
    const id = `RC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const now = new Date().toISOString();
    
    db.run(
      `INSERT INTO rule_configs (id, code, name, rule_category, rule_key, rule_value, threshold_value, priority, is_active, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, data.code, data.name, data.rule_category, data.rule_key, data.rule_value,
       data.threshold_value, data.priority || 0, data.is_active ? 1 : 0,
       data.owner_name, data.batch_id, data.remark, now, now]
    );
    
    await saveDatabase();
    return this.findById(id) as Promise<IRuleConfig>;
  }

  async update(id: string, data: Partial<IRuleConfig>): Promise<IRuleConfig | null> {
    const db = await getDatabase();
    const existing = await this.findById(id);
    if (!existing) return null;
    
    const fields = [];
    const values = [];
    
    for (const [key, value] of Object.entries(data)) {
      if (key !== 'id' && key !== 'created_at') {
        if (key === 'is_active') {
          fields.push(`${key} = ?`);
          values.push(value ? 1 : 0);
        } else {
          fields.push(`${key} = ?`);
          values.push(value);
        }
      }
    }
    
    if (fields.length === 0) return existing;
    
    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);
    
    db.run(`UPDATE rule_configs SET ${fields.join(', ')} WHERE id = ?`, values);
    await saveDatabase();
    
    return this.findById(id);
  }

  private mapResults(result: any[]): IRuleConfig[] {
    if (!result.length) return [];
    
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col: string, i: number) => {
        if (col === 'is_active') {
          obj[col] = row[i] === 1;
        } else {
          obj[col] = row[i];
        }
      });
      return obj as IRuleConfig;
    });
  }
}
