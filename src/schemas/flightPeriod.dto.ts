export interface CreateFlightPeriodDTO {
  code: string;
  name: string;
  flight_number: string;
  departure_time: string;
  arrival_time?: string;
  airport_code: string;
  terminal?: string;
  capacity?: number;
  used_count?: number;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}

export interface UpdateFlightPeriodDTO {
  name?: string;
  flight_number?: string;
  departure_time?: string;
  arrival_time?: string;
  airport_code?: string;
  terminal?: string;
  status?: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'archived';
  capacity?: number;
  used_count?: number;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}
