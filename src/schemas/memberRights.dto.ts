export interface CreateMemberRightsDTO {
  code: string;
  name: string;
  member_level: 'platinum' | 'gold' | 'silver';
  remaining_quota?: number;
  total_quota?: number;
  valid_from: string;
  valid_to: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}

export interface UpdateMemberRightsDTO {
  name?: string;
  status?: 'active' | 'expired' | 'suspended' | 'cancelled';
  remaining_quota?: number;
  total_quota?: number;
  valid_from?: string;
  valid_to?: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}
