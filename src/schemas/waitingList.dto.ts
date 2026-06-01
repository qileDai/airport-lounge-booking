export interface CreateWaitingListDTO {
  code: string;
  name: string;
  member_id?: string;
  booking_id?: string;
  wait_start_time: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}

export interface UpdateWaitingListDTO {
  name?: string;
  priority_score?: number;
  estimated_wait_minutes?: number;
  status?: 'waiting' | 'notified' | 'admitted' | 'cancelled' | 'expired';
  position?: number;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}
