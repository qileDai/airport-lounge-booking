export const VALID_STATUSES = [
  'draft',
  'pending_review',
  'pending_supplement',
  'confirmed',
  'archived',
  'rejected',
] as const;

export type ValidStatus = typeof VALID_STATUSES[number];

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  draft: ['pending_review', 'pending_supplement'],
  pending_review: ['confirmed', 'rejected', 'pending_supplement'],
  pending_supplement: ['pending_review', 'draft'],
  confirmed: ['archived'],
  rejected: ['pending_supplement'],
  archived: [],
};

export const MEMBER_LEVELS = ['diamond', 'platinum', 'gold', 'silver'] as const;
export type MemberLevel = typeof MEMBER_LEVELS[number];

export const MEMBER_LEVEL_WEIGHTS: Record<string, number> = {
  diamond: 40,
  platinum: 30,
  gold: 20,
  silver: 10,
};

export const WAITLIST_STATUSES = ['waiting', 'transferred', 'cancelled'] as const;
export const VOUCHER_STATUSES = ['draft', 'issued', 'used', 'expired', 'cancelled'] as const;
export const VERIFICATION_RESULTS = ['passed', 'failed', 'inconclusive'] as const;
export const EXCEPTION_STATUSES = ['pending', 'handling', 'resolved', 'closed'] as const;

export interface BatchImportItem {
  code: string;
  name: string;
  responsible_person: string;
  member_benefit_id?: number;
  flight_slot_id?: number;
  companion_count?: number;
  batch_no?: string;
  remark?: string;
}

export interface BatchImportResult {
  total: number;
  valid: number;
  invalid: number;
  errors: Array<{ index: number; code: string; reason: string }>;
  imported: Array<{ id: number; code: string; name: string }>;
}

export interface PriorityInput {
  member_level: string;
  remaining_quota: number;
  total_quota: number;
  departure_time: string | null;
  wait_start_time: string | null;
}

export interface PriorityOutput {
  member_level_weight: number;
  quota_weight: number;
  flight_slot_weight: number;
  wait_time_weight: number;
  total_score: number;
}

export interface StatisticsFilter {
  group_by: 'day' | 'batch' | 'responsible_person';
  start_date?: string;
  end_date?: string;
  batch_no?: string;
  responsible_person?: string;
}

export interface StatisticsResult {
  group_key: string;
  total_count: number;
  passed_count: number;
  failed_count: number;
  rate: number;
  details: Array<{ id: number; code: string; result: string; created_at: string }>;
}

export interface ExceptionCheckResult {
  found: number;
  events: Array<{
    id: number;
    code: string;
    entity_type: string;
    entity_id: number;
    trigger_field: string;
    threshold_value: string;
  }>;
}
