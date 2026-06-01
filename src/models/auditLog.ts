export interface AuditLog {
  id: number;
  code: string;
  action: string;
  entity_type: string;
  entity_id: number;
  operator: string;
  detail: string | null;
  created_at: string;
}

export type AuditLogCreate = Omit<AuditLog, 'id' | 'created_at'>;
