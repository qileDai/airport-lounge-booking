export interface MemberBenefit {
  id: number;
  code: string;
  name: string;
  status: string;
  responsible_person: string;
  member_level: string;
  remaining_quota: number;
  total_quota: number;
  effective_date: string | null;
  expiry_date: string | null;
  batch_no: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type MemberBenefitCreate = Omit<MemberBenefit, 'id' | 'created_at' | 'updated_at'>;
export type MemberBenefitUpdate = Partial<MemberBenefitCreate>;
