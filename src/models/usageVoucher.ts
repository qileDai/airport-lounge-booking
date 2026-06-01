export interface UsageVoucher {
  id: number;
  code: string;
  name: string;
  status: string;
  responsible_person: string;
  reservation_id: number | null;
  voucher_type: string | null;
  issued_at: string | null;
  used_at: string | null;
  batch_no: string | null;
  remark: string | null;
  created_at: string;
  updated_at: string;
}

export type UsageVoucherCreate = Omit<UsageVoucher, 'id' | 'created_at' | 'updated_at'>;
export type UsageVoucherUpdate = Partial<UsageVoucherCreate>;
