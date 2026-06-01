export interface StatusFlowRecord {
  id: number;
  code: string;
  name: string;
  status: string;
  responsible_person: string;
  entity_type: string;
  entity_id: number;
  from_status: string;
  to_status: string;
  action: string;
  reject_reason: string | null;
  batch_no: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type StatusFlowRecordCreate = Omit<StatusFlowRecord, 'id' | 'created_at' | 'updated_at'>;
export type StatusFlowRecordUpdate = Partial<StatusFlowRecordCreate>;
