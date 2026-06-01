export interface IMemberRights {
  id: string;
  code: string;
  name: string;
  member_level: 'platinum' | 'gold' | 'silver';
  status: 'active' | 'expired' | 'suspended' | 'cancelled';
  remaining_quota: number;
  total_quota: number;
  valid_from: string;
  valid_to: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface IBookingRecord {
  id: string;
  code: string;
  name: string;
  member_id?: string;
  flight_number?: string;
  flight_date?: string;
  lounge_id?: string;
  status: 'draft' | 'pending_review' | 'confirmed' | 'rejected' | 'supplement_required' | 'archived';
  companion_count: number;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface IFlightPeriod {
  id: string;
  code: string;
  name: string;
  flight_number: string;
  departure_time: string;
  arrival_time?: string;
  airport_code: string;
  terminal?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'archived';
  capacity: number;
  used_count: number;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface ICompanion {
  id: string;
  code: string;
  name: string;
  booking_id?: string;
  id_type?: string;
  id_number?: string;
  relationship?: string;
  status: 'pending' | 'verified' | 'rejected' | 'cancelled';
  is_verified: boolean;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface IUsageVoucher {
  id: string;
  code: string;
  name: string;
  voucher_type: 'lounge_entry' | 'meal_voucher' | 'parking' | 'other';
  booking_id?: string;
  member_id?: string;
  status: 'valid' | 'used' | 'expired' | 'voided' | 'frozen' | 'pending_issue';
  issued_at?: string;
  used_at?: string;
  expire_at?: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface IWaitingList {
  id: string;
  code: string;
  name: string;
  member_id?: string;
  booking_id?: string;
  priority_score: number;
  wait_start_time: string;
  estimated_wait_minutes: number;
  status: 'waiting' | 'notified' | 'admitted' | 'cancelled' | 'expired';
  position: number;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface IVerificationResult {
  id: string;
  code: string;
  name: string;
  member_id?: string;
  booking_id?: string;
  verification_type: string;
  result: 'passed' | 'failed' | 'warning' | 'draft' | 'suspended';
  score: number;
  rule_violations?: string;
  exception_flags?: string;
  status: 'draft' | 'pending_review' | 'confirmed' | 'rejected' | 'supplement_required' | 'archived';
  reviewer_name?: string;
  review_time?: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface IStatusTransition {
  id: string;
  entity_type: string;
  entity_id: string;
  from_status?: string;
  to_status: string;
  action: string;
  reason?: string;
  operator_name?: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
  created_at: string;
}

export interface IRuleConfig {
  id: string;
  code: string;
  name: string;
  rule_category: string;
  rule_key: string;
  rule_value?: string;
  threshold_value?: number;
  priority: number;
  is_active: boolean;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}

export interface IExceptionEvent {
  id: string;
  code: string;
  name: string;
  exception_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_entity_type?: string;
  source_entity_id?: string;
  trigger_field?: string;
  threshold_value?: string;
  actual_value?: string;
  handler_name?: string;
  deadline?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  resolution?: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
  created_at: string;
  updated_at: string;
}
