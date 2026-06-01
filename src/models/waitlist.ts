export interface Waitlist {
  id: number;
  code: string;
  name: string;
  status: string;
  responsible_person: string;
  member_benefit_id: number | null;
  flight_slot_id: number | null;
  wait_start_time: string | null;
  priority_score: number;
  batch_no: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type WaitlistCreate = Omit<Waitlist, 'id' | 'created_at' | 'updated_at'>;
export type WaitlistUpdate = Partial<WaitlistCreate>;
