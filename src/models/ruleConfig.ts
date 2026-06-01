export interface RuleConfig {
  id: number;
  code: string;
  name: string;
  status: string;
  responsible_person: string;
  rule_type: string;
  rule_value: string;
  threshold: string | null;
  batch_no: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type RuleConfigCreate = Omit<RuleConfig, 'id' | 'created_at' | 'updated_at'>;
export type RuleConfigUpdate = Partial<RuleConfigCreate>;
