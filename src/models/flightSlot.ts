export interface FlightSlot {
  id: number;
  code: string;
  name: string;
  status: string;
  responsible_person: string;
  airport_code: string;
  flight_number: string;
  departure_time: string | null;
  arrival_time: string | null;
  capacity: number;
  used_count: number;
  is_archived: number;
  snapshot_data: string | null;
  batch_no: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type FlightSlotCreate = Omit<FlightSlot, 'id' | 'created_at' | 'updated_at'>;
export type FlightSlotUpdate = Partial<FlightSlotCreate>;
