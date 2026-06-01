export interface ExceptionEvent {
  id: number;
  code: string;
  name: string;
  status: string;
  responsible_person: string;
  entity_type: string;
  entity_id: number;
  trigger_field: string;
  threshold_value: string;
  handler: string | null;
  handling_deadline: string | null;
  batch_no: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type ExceptionEventCreate = Omit<ExceptionEvent, 'id' | 'created_at' | 'updated_at'>;
export type ExceptionEventUpdate = Partial<ExceptionEventCreate>;
