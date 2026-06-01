export interface Reservation {
  id: number;
  code: string;
  name: string;
  status: string;
  responsible_person: string;
  member_benefit_id: number | null;
  flight_slot_id: number | null;
  companion_count: number;
  batch_no: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type ReservationCreate = Omit<Reservation, 'id' | 'created_at' | 'updated_at'>;
export type ReservationUpdate = Partial<ReservationCreate>;
