export interface CreateCompanionDTO {
  code: string;
  name: string;
  booking_id?: string;
  id_type?: string;
  id_number?: string;
  relationship?: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}

export interface UpdateCompanionDTO {
  name?: string;
  booking_id?: string;
  id_type?: string;
  id_number?: string;
  relationship?: string;
  status?: 'pending' | 'verified' | 'rejected' | 'cancelled';
  is_verified?: boolean;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}
