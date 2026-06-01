export interface CreateUsageVoucherDTO {
  code: string;
  name: string;
  voucher_type: 'lounge_entry' | 'meal_voucher' | 'parking' | 'other';
  booking_id?: string;
  member_id?: string;
  issued_at?: string;
  expire_at?: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}

export interface UpdateUsageVoucherDTO {
  name?: string;
  status?: 'valid' | 'used' | 'expired' | 'voided' | 'frozen' | 'pending_issue';
  used_at?: string;
  expire_at?: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}
