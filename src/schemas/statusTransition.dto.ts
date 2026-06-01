export interface StatusTransitionDTO {
  entity_type: string;
  entity_id: string;
  to_status: string;
  action: string;
  reason?: string;
  operator_name?: string;
  owner_name?: string;
  batch_id?: string;
  remark?: string;
}
