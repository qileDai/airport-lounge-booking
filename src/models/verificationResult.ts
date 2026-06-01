export interface VerificationResult {
  id: number;
  code: string;
  name: string;
  status: string;
  responsible_person: string;
  reservation_id: number | null;
  member_benefit_id: number | null;
  result: string | null;
  fail_reason: string | null;
  batch_no: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type VerificationResultCreate = Omit<VerificationResult, 'id' | 'created_at' | 'updated_at'>;
export type VerificationResultUpdate = Partial<VerificationResultCreate>;
