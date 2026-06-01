export interface CreateBookingRecordDTO {
  code: string;
  name: string;
  member_id?: string;
  flight_number?: string;
  flight_date?: string;
  lounge_id?: string;
  companion_count?: number;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}

export interface UpdateBookingRecordDTO {
  name?: string;
  member_id?: string;
  flight_number?: string;
  flight_date?: string;
  lounge_id?: string;
  status?: 'draft' | 'pending_review' | 'confirmed' | 'rejected' | 'supplement_required' | 'archived';
  companion_count?: number;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}

export interface BatchImportBookingDTO {
  records: Array<{
    code: string;
    name: string;
    member_id?: string;
    flight_number?: string;
    flight_date?: string;
    lounge_id?: string;
    companion_count?: number;
    owner_name?: string;
    batch_id?: string;
    remark?: string;
  }>;
}

export interface PrecheckResult {
  code: string;
  valid: boolean;
  errors: string[];
  warnings: string[];
}
