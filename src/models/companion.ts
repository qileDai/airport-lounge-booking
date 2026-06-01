export interface Companion {
  id: number;
  code: string;
  name: string;
  status: string;
  responsible_person: string;
  reservation_id: number | null;
  relationship: string | null;
  id_number: string | null;
  batch_no: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type CompanionCreate = Omit<Companion, 'id' | 'created_at' | 'updated_at'>;
export type CompanionUpdate = Partial<CompanionCreate>;
