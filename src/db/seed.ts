import { v4 as uuidv4 } from 'uuid';
import { getDatabase, saveDatabase } from './database';

export async function seedDatabase() {
  const db = await getDatabase();
  
  const now = new Date().toISOString();
  
  const memberRights = [
    { id: uuidv4(), code: 'MR-2024-PEK-001', name: '白金卡贵宾厅权益', member_level: 'platinum', status: 'active', remaining_quota: 8, total_quota: 12, valid_from: '2024-01-01', valid_to: '2025-12-31', owner_name: '张经理', batch_id: 'BATCH-2024-Q1', remark: '北京首都机场T3航站楼权益' },
    { id: uuidv4(), code: 'MR-2024-PVG-002', name: '金卡贵宾厅权益', member_level: 'gold', status: 'active', remaining_quota: 5, total_quota: 8, valid_from: '2024-03-15', valid_to: '2025-03-14', owner_name: '李主管', batch_id: 'BATCH-2024-Q1', remark: '上海浦东机场T2航站楼' },
    { id: uuidv4(), code: 'MR-2024-CAN-003', name: '银卡贵宾厅权益', member_level: 'silver', status: 'active', remaining_quota: 3, total_quota: 5, valid_from: '2024-06-01', valid_to: '2025-05-31', owner_name: '王专员', batch_id: 'BATCH-2024-Q2', remark: '广州白云机场T1航站楼' },
    { id: uuidv4(), code: 'MR-2024-SZX-004', name: '白金卡贵宾厅权益', member_level: 'platinum', status: 'expired', remaining_quota: 0, total_quota: 10, valid_from: '2023-01-01', valid_to: '2024-01-31', owner_name: '赵经理', batch_id: 'BATCH-2023-Q4', remark: '深圳宝安机场 - 权益已过期' },
    { id: uuidv4(), code: 'MR-2024-CTU-005', name: '金卡贵宾厅权益', member_level: 'gold', status: 'suspended', remaining_quota: 2, total_quota: 6, valid_from: '2024-04-01', valid_to: '2025-03-31', owner_name: '刘专员', batch_id: 'BATCH-2024-Q2', remark: '成都双流机场 - 暂停使用中' }
  ];

  const bookingRecords = [
    { id: uuidv4(), code: 'BK-20240115-001', name: '张三预约记录', member_id: memberRights[0].id, flight_number: 'CA1234', flight_date: '2024-01-20T08:30:00Z', lounge_id: 'LOUNGE-PEK-T3-01', status: 'confirmed', companion_count: 2, owner_name: '客服A', batch_id: 'BATCH-2024-W02', remark: '已确认预约' },
    { id: uuidv4(), code: 'BK-20240116-002', name: '李四预约记录', member_id: memberRights[1].id, flight_number: 'MU5678', flight_date: '2024-01-21T10:00:00Z', lounge_id: 'LOUNGE-PVG-T2-01', status: 'pending_review', companion_count: 1, owner_name: '客服B', batch_id: 'BATCH-2024-W03', remark: '待复核中' },
    { id: uuidv4(), code: 'BK-20240117-003', name: '王五预约记录', member_id: memberRights[2].id, flight_number: 'CZ9012', flight_date: '2024-01-22T14:15:00Z', lounge_id: 'LOUNGE-CAN-T1-01', status: 'draft', companion_count: 0, owner_name: '客服C', batch_id: 'BATCH-2024-W03', remark: '草稿状态，缺少航班信息' },
    { id: uuidv4(), code: 'BK-20240118-004', name: '赵六预约记录', member_id: memberRights[3].id, flight_number: 'ZH3456', flight_date: '2024-02-01T09:00:00Z', lounge_id: 'LOUNGE-SZX-T3-01', status: 'rejected', companion_count: 1, owner_name: '客服D', batch_id: 'BATCH-2024-W04', remark: '已驳回：会员权益已过期' },
    { id: uuidv4(), code: 'BK-20240119-005', name: '孙七预约记录', member_id: memberRights[4].id, flight_number: '3U7890', flight_date: '2024-01-25T16:45:00Z', lounge_id: 'LOUNGE-CTU-T2-01', status: 'supplement_required', companion_count: 0, owner_name: '客服E', batch_id: 'BATCH-2024-W04', remark: '待补充：缺少同行人信息' },
    { id: uuidv4(), code: 'BK-20240120-006', name: '周八预约记录', member_id: memberRights[0].id, flight_number: 'CA1357', flight_date: '2024-01-28T11:20:00Z', lounge_id: 'LOUNGE-PEK-T3-01', status: 'archived', companion_count: 3, owner_name: '客服F', batch_id: 'BATCH-2024-W04', remark: '已完成归档' }
  ];

  const flightPeriods = [
    { id: uuidv4(), code: 'FP-20240120-001', name: '早高峰时段-CA1234', flight_number: 'CA1234', departure_time: '2024-01-20T08:30:00Z', arrival_time: '2024-01-20T11:45:00Z', airport_code: 'PEK', terminal: 'T3', status: 'scheduled', capacity: 50, used_count: 42, owner_name: '调度员甲', batch_id: 'BATCH-2024-W02', remark: '早高峰时段，接近满员' },
    { id: uuidv4(), code: 'FP-20240121-002', name: '上午时段-MU5678', flight_number: 'MU5678', departure_time: '2024-01-21T10:00:00Z', arrival_time: '2024-01-21T13:20:00Z', airport_code: 'PVG', terminal: 'T2', status: 'scheduled', capacity: 45, used_count: 28, owner_name: '调度员乙', batch_id: 'BATCH-2024-W03', remark: '正常时段' },
    { id: uuidv4(), code: 'FP-20240122-003', name: '下午时段-CZ9012', flight_number: 'CZ9012', departure_time: '2024-01-22T14:15:00Z', arrival_time: '2024-01-22T17:30:00Z', airport_code: 'CAN', terminal: 'T1', status: 'scheduled', capacity: 40, used_count: 35, owner_name: '调度员丙', batch_id: 'BATCH-2024-W03', remark: '下午时段，余位紧张' },
    { id: uuidv4(), code: 'FP-20240201-004', name: '上午时段-ZH3456', flight_number: 'ZH3456', departure_time: '2024-02-01T09:00:00Z', arrival_time: '2024-02-01T12:10:00Z', airport_code: 'SZX', terminal: 'T3', status: 'archived', capacity: 38, used_count: 38, owner_name: '调度员丁', batch_id: 'BATCH-2024-W04', remark: '已归档时段' },
    { id: uuidv4(), code: 'FP-20240125-005', name: '下午晚段-3U7890', flight_number: '3U7890', departure_time: '2024-01-25T16:45:00Z', arrival_time: '2024-01-25T19:55:00Z', airport_code: 'CTU', terminal: 'T2', status: 'scheduled', capacity: 42, used_count: 15, owner_name: '调度员戊', batch_id: 'BATCH-2024-W04', remark: '傍晚时段，余位充足' }
  ];

  const companions = [
    { id: uuidv4(), code: 'CP-BK001-001', name: '张三配偶', booking_id: bookingRecords[0].id, id_type: '身份证', id_number: '110101199001011234', relationship: '配偶', status: 'verified', is_verified: 1, owner_name: '核验员A', batch_id: 'BATCH-2024-W02', remark: '已通过身份核验' },
    { id: uuidv4(), code: 'CP-BK001-002', name: '张三子女', booking_id: bookingRecords[0].id, id_type: '身份证', id_number: '110101201505012345', relationship: '子女', status: 'verified', is_verified: 1, owner_name: '核验员A', batch_id: 'BATCH-2024-W02', remark: '未成年子女，已验证' },
    { id: uuidv4(), code: 'CP-BK002-001', name: '李四同事', booking_id: bookingRecords[1].id, id_type: '护照', id_number: 'E12345678', relationship: '同事', status: 'pending', is_verified: 0, owner_name: '核验员B', batch_id: 'BATCH-2024-W03', remark: '待核验护照信息' },
    { id: uuidv4(), code: 'CP-BK004-001', name: '赵六朋友', booking_id: bookingRecords[3].id, id_type: '身份证', id_number: '440305198808089876', relationship: '朋友', status: 'rejected', is_verified: 0, owner_name: '核验员C', batch_id: 'BATCH-2024-W04', remark: '主预约被驳回，同行人一并驳回' },
    { id: uuidv4(), code: 'CP-BK006-001', name: '周八客户', booking_id: bookingRecords[5].id, id_type: '身份证', id_number: '310101197512126543', relationship: '客户', status: 'verified', is_verified: 1, owner_name: '核验员D', batch_id: 'BATCH-2024-W04', remark: '商务陪同，已核验' },
    { id: uuidv4(), code: 'CP-BK006-002', name: '周八合作伙伴', booking_id: bookingRecords[5].id, id_type: '护照', id_number: 'G98765432', relationship: '合作伙伴', status: 'verified', is_verified: 1, owner_name: '核验员D', batch_id: 'BATCH-2024-W04', remark: '国际商务伙伴' },
    { id: uuidv4(), code: 'CP-BK006-003', name: '周八家属', booking_id: bookingRecords[5].id, id_type: '身份证', id_number: '320106196303034321', relationship: '父母', status: 'verified', is_verified: 1, owner_name: '核验员D', batch_id: 'BATCH-2024-W04', remark: '年迈父母陪同出行' }
  ];

  const usageVouchers = [
    { id: uuidv4(), code: 'UV-20240120-001', name: '张三贵宾厅入场券', voucher_type: 'lounge_entry', booking_id: bookingRecords[0].id, member_id: memberRights[0].id, status: 'used', issued_at: '2024-01-19T10:00:00Z', used_at: '2024-01-20T07:45:00Z', expire_at: '2024-01-20T12:00:00Z', owner_name: '发券员A', batch_id: 'BATCH-2024-W02', remark: '已使用' },
    { id: uuidv4(), code: 'UV-20240121-002', name: '李四贵宾厅入场券', voucher_type: 'lounge_entry', booking_id: bookingRecords[1].id, member_id: memberRights[1].id, status: 'valid', issued_at: '2024-01-20T14:00:00Z', used_at: null, expire_at: '2024-01-21T14:00:00Z', owner_name: '发券员B', batch_id: 'BATCH-2024-W03', remark: '待使用' },
    { id: uuidv4(), code: 'UV-20240122-003', name: '王五贵宾厅入场券', voucher_type: 'lounge_entry', booking_id: bookingRecords[2].id, member_id: memberRights[2].id, status: 'pending_issue', issued_at: null, used_at: null, expire_at: '2024-01-22T18:00:00Z', owner_name: '发券员C', batch_id: 'BATCH-2024-W03', remark: '待发放' },
    { id: uuidv4(), code: 'UV-20240201-004', name: '赵六贵宾厅入场券(作废)', voucher_type: 'lounge_entry', booking_id: bookingRecords[3].id, member_id: memberRights[3].id, status: 'voided', issued_at: null, used_at: null, expire_at: '2024-02-01T12:00:00Z', owner_name: '发券员D', batch_id: 'BATCH-2024-W04', remark: '已作废-权益过期' },
    { id: uuidv4(), code: 'UV-20240125-005', name: '孙七贵宾厅入场券', voucher_type: 'lounge_entry', booking_id: bookingRecords[4].id, member_id: memberRights[4].id, status: 'frozen', issued_at: '2024-01-24T09:00:00Z', used_at: null, expire_at: '2024-01-25T20:00:00Z', owner_name: '发券员E', batch_id: 'BATCH-2024-W04', remark: '已冻结-待补充资料' },
    { id: uuidv4(), code: 'UV-20240120-006', name: '周八餐饮券', voucher_type: 'meal_voucher', booking_id: bookingRecords[5].id, member_id: memberRights[0].id, status: 'used', issued_at: '2024-01-27T16:00:00Z', used_at: '2024-01-28T11:00:00Z', expire_at: '2024-01-28T14:00:00Z', owner_name: '发券员F', batch_id: 'BATCH-2024-W04', remark: '餐饮套餐券已消费' }
  ];

  const waitingList = [
    { id: uuidv4(), code: 'WL-20240120-001', name: '吴九候补申请', member_id: memberRights[1].id, booking_id: null, priority_score: 85.5, wait_start_time: '2024-01-20T06:00:00Z', estimated_wait_minutes: 45, status: 'waiting', position: 1, owner_name: '候补管理员A', batch_id: 'BATCH-2024-W02', remark: '金卡会员，优先级较高' },
    { id: uuidv4(), code: 'WL-20240120-002', name: '郑十候补申请', member_id: memberRights[2].id, booking_id: null, priority_score: 72.3, wait_start_time: '2024-01-20T06:30:00Z', estimated_wait_minutes: 60, status: 'waiting', position: 2, owner_name: '候补管理员A', batch_id: 'BATCH-2024-W02', remark: '银卡会员，中等优先级' },
    { id: uuidv4(), code: 'WL-20240121-001', name: '陈十一候补申请', member_id: memberRights[0].id, booking_id: null, priority_score: 92.8, wait_start_time: '2024-01-21T07:00:00Z', estimated_wait_minutes: 30, status: 'notified', position: 1, owner_name: '候补管理员B', batch_id: 'BATCH-2024-W03', remark: '白金会员，已通知可入场' },
    { id: uuidv4(), code: 'WL-20240121-002', name: '林十二候补申请', member_id: memberRights[1].id, booking_id: null, priority_score: 68.4, wait_start_time: '2024-01-21T07:15:00Z', estimated_wait_minutes: 75, status: 'waiting', position: 3, owner_name: '候补管理员B', batch_id: 'BATCH-2024-W03', remark: '等待中' },
    { id: uuidv4(), code: 'WL-20240122-001', name: '黄十三候补申请(已取消)', member_id: memberRights[2].id, booking_id: null, priority_score: 65.2, wait_start_time: '2024-01-22T08:00:00Z', estimated_wait_minutes: 0, status: 'cancelled', position: 0, owner_name: '候补管理员C', batch_id: 'BATCH-2024-W03', remark: '用户主动取消候补' }
  ];

  const verificationResults = [
    { id: uuidv4(), code: 'VR-20240120-001', name: '张三资格核验结果', member_id: memberRights[0].id, booking_id: bookingRecords[0].id, verification_type: 'eligibility_check', result: 'passed', score: 95.5, rule_violations: null, exception_flags: null, status: 'confirmed', reviewer_name: '审核员A', review_time: '2024-01-19T11:00:00Z', owner_name: '审核组长A', batch_id: 'BATCH-2024-W02', remark: '完全符合权益规则' },
    { id: uuidv4(), code: 'VR-20240121-002', name: '李四资格核验结果', member_id: memberRights[1].id, booking_id: bookingRecords[1].id, verification_type: 'eligibility_check', result: 'warning', score: 78.2, rule_violations: '同行人未完全核验', exception_flags: null, status: 'pending_review', reviewer_name: null, review_time: null, owner_name: '审核组长B', batch_id: 'BATCH-2024-W03', remark: '需要补充同行人信息' },
    { id: uuidv4(), code: 'VR-20240122-003', name: '王五资格核验结果', member_id: memberRights[2].id, booking_id: bookingRecords[2].id, verification_type: 'eligibility_check', result: 'draft', score: 45.0, rule_violations: '缺少关键信息', exception_flags: null, status: 'draft', reviewer_name: null, review_time: null, owner_name: '审核组长C', batch_id: 'BATCH-2024-W03', remark: '草稿状态，不允许正式提交' },
    { id: uuidv4(), code: 'VR-20240201-004', name: '赵六资格核验结果(异常)', member_id: memberRights[3].id, booking_id: bookingRecords[3].id, verification_type: 'eligibility_check', result: 'failed', score: 0, rule_violations: '权益已过期', exception_flags: 'EXPIRED_RIGHTS', status: 'rejected', reviewer_name: '审核员D', review_time: '2024-01-25T09:00:00Z', owner_name: '审核组长D', batch_id: 'BATCH-2024-W04', remark: '权益过期异常' },
    { id: uuidv4(), code: 'VR-20240125-005', name: '孙七资格核验结果', member_id: memberRights[4].id, booking_id: bookingRecords[4].id, verification_type: 'eligibility_check', result: 'suspended', score: 60.0, rule_violations: '权益暂停使用', exception_flags: 'SUSPENDED_ACCOUNT', status: 'supplement_required', reviewer_name: '审核员E', review_time: '2024-01-24T14:00:00Z', owner_name: '审核组长E', batch_id: 'BATCH-2024-W04', remark: '账户暂停，需补充说明' },
    { id: uuidv4(), code: 'VR-20240128-006', name: '周八资格核验结果(归档)', member_id: memberRights[0].id, booking_id: bookingRecords[5].id, verification_type: 'eligibility_check', result: 'passed', score: 88.7, rule_violations: null, exception_flags: null, status: 'archived', reviewer_name: '审核员F', review_time: '2024-01-27T16:00:00Z', owner_name: '审核组长F', batch_id: 'BATCH-2024-W04', remark: '已完成并归档' }
  ];

  const statusTransitions = [
    { id: uuidv4(), entity_type: 'booking_record', entity_id: bookingRecords[0].id, from_status: 'draft', to_status: 'confirmed', action: 'confirm_booking', reason: null, operator_name: '客服A', owner_name: '系统自动', batch_id: 'BATCH-2024-W02', remark: '预约确认' },
    { id: uuidv4(), entity_type: 'booking_record', entity_id: bookingRecords[3].id, from_status: 'pending_review', to_status: 'rejected', action: 'reject_booking', reason: '会员权益已过期，无法完成预约', operator_name: '客服D', owner_name: '系统自动', batch_id: 'BATCH-2024-W04', remark: '驳回原因：权益过期' },
    { id: uuidv4(), entity_type: 'member_rights', entity_id: memberRights[3].id, from_status: 'active', to_status: 'expired', action: 'expire_rights', reason: '权益有效期届满', operator_name: '系统定时任务', owner_name: '系统自动', batch_id: 'BATCH-2024-W04', remark: '自动过期处理' },
    { id: uuidv4(), entity_type: 'waiting_list', entity_id: waitingList[2].id, from_status: 'waiting', to_status: 'notified', action: 'notify_available', reason: '有空位释放，通知候补用户', operator_name: '候补管理员B', owner_name: '系统自动', batch_id: 'BATCH-2024-W03', remark: '候补通知' },
    { id: uuidv4(), entity_type: 'verification_result', entity_id: verificationResults[3].id, from_status: 'pending_review', to_status: 'rejected', action: 'reject_verification', reason: '触发权益过期异常规则', operator_name: '审核员D', owner_name: '审核组长D', batch_id: 'BATCH-2024-W04', remark: '异常驳回' },
    { id: uuidv4(), entity_type: 'exception_event', entity_id: null, from_status: null, to_status: 'open', action: 'create_exception', reason: '检测到权益过期异常', operator_name: '系统检测', owner_name: '异常处理组', batch_id: 'BATCH-2024-W04', remark: '自动生成异常事件' }
  ];

  const ruleConfigs = [
    { id: uuidv4(), code: 'RC-PRIORITY-001', name: '入场优先级计算规则', rule_category: 'priority_calculation', rule_key: 'member_level_weight', rule_value: '{"platinum": 100, "gold": 75, "silver": 50}', threshold_value: null, priority: 1, is_active: 1, owner_name: '规则配置师A', batch_id: 'RULES-2024-V1', remark: '会员等级权重配置' },
    { id: uuidv4(), code: 'RC-PRIORITY-002', name: '剩余额度权重规则', rule_category: 'priority_calculation', rule_key: 'remaining_quota_weight', rule_value: 'linear_scale_0_to_10', threshold_value: null, priority: 2, is_active: 1, owner_name: '规则配置师A', batch_id: 'RULES-2024-V1', remark: '剩余额度影响因子' },
    { id: uuidv4(), code: 'RC-EXCEPTION-001', name: '权益过期异常判定规则', rule_category: 'exception_detection', rule_key: 'expiry_threshold_days', rule_value: '0', threshold_value: 0, priority: 1, is_active: 1, owner_name: '规则配置师B', batch_id: 'RULES-2024-V1', remark: '过期即触发异常' },
    { id: uuidv4(), code: 'RC-COMPANION-001', name: '同行人数量限制规则', rule_category: 'companion_rules', rule_key: 'max_companions_by_level', rule_value: '{"platinum": 3, "gold": 2, "silver": 1}', threshold_value: null, priority: 3, is_active: 1, owner_name: '规则配置师C', batch_id: 'RULES-2024-V1', remark: '各等级最大同行人数' },
    { id: uuidv4(), code: 'RC-STATUS-001', name: '状态流转限制规则', rule_category: 'status_transition', rule_key: 'allowed_transitions', rule_value: 'draft->pending_review, pending_review->confirmed|rejected|supplement_required, confirmed->archived, supplement_required->pending_review|rejected', threshold_value: null, priority: 1, is_active: 1, owner_name: '规则配置师D', batch_id: 'RULES-2024-V1', remark: '合法状态流转路径' },
    { id: uuidv4(), code: 'RC-WAITING-001', name: '候补等待时间计算规则', rule_category: 'waiting_list', rule_key: 'wait_time_factor', rule_value: 'exponential_decay', threshold_value: 120, priority: 4, is_active: 1, owner_name: '规则配置师E', batch_id: 'RULES-2024-V1', remark: '等待时间衰减系数' }
  ];

  const exceptionEvents = [
    { id: uuidv4(), code: 'EE-20240201-001', name: '赵六权益过期异常', exception_type: 'rights_expired', severity: 'high', source_entity_type: 'member_rights', source_entity_id: memberRights[3].id, trigger_field: 'valid_to', threshold_value: '2024-01-31', actual_value: '2024-01-31', handler_name: '异常处理员A', deadline: '2024-02-05T23:59:59Z', status: 'resolved', resolution: '已通知会员续费或升级', owner_name: '异常处理组长A', batch_id: 'BATCH-2024-W04', remark: '权益过期异常已处理' },
    { id: uuidv4(), code: 'EE-20240125-002', name: '孙七账户暂停异常', exception_type: 'account_suspended', severity: 'medium', source_entity_type: 'member_rights', source_entity_id: memberRights[4].id, trigger_field: 'status', threshold_value: 'active', actual_value: 'suspended', handler_name: '异常处理员B', deadline: '2024-01-30T23:59:59Z', status: 'open', resolution: null, owner_name: '异常处理组长B', batch_id: 'BATCH-2024-W04', remark: '待联系会员确认原因' },
    { id: uuidv4(), code: 'EE-20240120-003', name: '张三同行人超额预警', exception_type: 'companion_exceeded', severity: 'low', source_entity_type: 'booking_record', source_entity_id: bookingRecords[0].id, trigger_field: 'companion_count', threshold_value: '3', actual_value: '2', handler_name: '异常处理员C', deadline: '2024-01-22T23:59:59Z', status: 'closed', resolution: '未超限，误报', owner_name: '异常处理组长C', batch_id: 'BATCH-2024-W02', remark: '预警解除' },
    { id: uuidv4(), code: 'EE-20240121-004', name: '李四核验警告异常', exception_type: 'verification_warning', severity: 'medium', source_entity_type: 'verification_result', source_entity_id: verificationResults[1].id, trigger_field: 'rule_violations', threshold_value: null, actual_value: '同行人未完全核验', handler_name: '异常处理员D', deadline: '2024-01-26T23:59:59Z', status: 'in_progress', resolution: null, owner_name: '异常处理组长D', batch_id: 'BATCH-2024-W03', remark: '正在跟进补充资料' },
    { id: uuidv4(), code: 'EE-20240122-005', name: '广州机场时段容量告急', exception_type: 'capacity_warning', severity: 'high', source_entity_type: 'flight_period', source_entity_id: flightPeriods[2].id, trigger_field: 'used_count', threshold_value: '40', actual_value: '35', handler_name: '异常处理员E', deadline: '2024-01-22T14:00:00Z', status: 'open', resolution: null, owner_name: '异常处理组长E', batch_id: 'BATCH-2024-W03', remark: '容量接近上限，需关注' }
  ];

  for (const mr of memberRights) {
    db.run(
      `INSERT INTO member_rights (id, code, name, member_level, status, remaining_quota, total_quota, valid_from, valid_to, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [mr.id, mr.code, mr.name, mr.member_level, mr.status, mr.remaining_quota, mr.total_quota, mr.valid_from, mr.valid_to, mr.owner_name, mr.batch_id, mr.remark, now, now]
    );
  }

  for (const br of bookingRecords) {
    db.run(
      `INSERT INTO booking_records (id, code, name, member_id, flight_number, flight_date, lounge_id, status, companion_count, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [br.id, br.code, br.name, br.member_id, br.flight_number, br.flight_date, br.lounge_id, br.status, br.companion_count, br.owner_name, br.batch_id, br.remark, now, now]
    );
  }

  for (const fp of flightPeriods) {
    db.run(
      `INSERT INTO flight_periods (id, code, name, flight_number, departure_time, arrival_time, airport_code, terminal, status, capacity, used_count, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fp.id, fp.code, fp.name, fp.flight_number, fp.departure_time, fp.arrival_time, fp.airport_code, fp.terminal, fp.status, fp.capacity, fp.used_count, fp.owner_name, fp.batch_id, fp.remark, now, now]
    );
  }

  for (const cp of companions) {
    db.run(
      `INSERT INTO companions (id, code, name, booking_id, id_type, id_number, relationship, status, is_verified, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [cp.id, cp.code, cp.name, cp.booking_id, cp.id_type, cp.id_number, cp.relationship, cp.status, cp.is_verified, cp.owner_name, cp.batch_id, cp.remark, now, now]
    );
  }

  for (const uv of usageVouchers) {
    db.run(
      `INSERT INTO usage_vouchers (id, code, name, voucher_type, booking_id, member_id, status, issued_at, used_at, expire_at, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [uv.id, uv.code, uv.name, uv.voucher_type, uv.booking_id, uv.member_id, uv.status, uv.issued_at, uv.used_at, uv.expire_at, uv.owner_name, uv.batch_id, uv.remark, now, now]
    );
  }

  for (const wl of waitingList) {
    db.run(
      `INSERT INTO waiting_list (id, code, name, member_id, booking_id, priority_score, wait_start_time, estimated_wait_minutes, status, position, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [wl.id, wl.code, wl.name, wl.member_id, wl.booking_id, wl.priority_score, wl.wait_start_time, wl.estimated_wait_minutes, wl.status, wl.position, wl.owner_name, wl.batch_id, wl.remark, now, now]
    );
  }

  for (const vr of verificationResults) {
    db.run(
      `INSERT INTO verification_results (id, code, name, member_id, booking_id, verification_type, result, score, rule_violations, exception_flags, status, reviewer_name, review_time, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [vr.id, vr.code, vr.name, vr.member_id, vr.booking_id, vr.verification_type, vr.result, vr.score, vr.rule_violations, vr.exception_flags, vr.status, vr.reviewer_name, vr.review_time, vr.owner_name, vr.batch_id, vr.remark, now, now]
    );
  }

  for (const st of statusTransitions) {
    db.run(
      `INSERT INTO status_transitions (id, entity_type, entity_id, from_status, to_status, action, reason, operator_name, owner_name, batch_id, remark, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [st.id, st.entity_type, st.entity_id, st.from_status, st.to_status, st.action, st.reason, st.operator_name, st.owner_name, st.batch_id, st.remark, now]
    );
  }

  for (const rc of ruleConfigs) {
    db.run(
      `INSERT INTO rule_configs (id, code, name, rule_category, rule_key, rule_value, threshold_value, priority, is_active, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [rc.id, rc.code, rc.name, rc.rule_category, rc.rule_key, rc.rule_value, rc.threshold_value, rc.priority, rc.is_active, rc.owner_name, rc.batch_id, rc.remark, now, now]
    );
  }

  for (const ee of exceptionEvents) {
    db.run(
      `INSERT INTO exception_events (id, code, name, exception_type, severity, source_entity_type, source_entity_id, trigger_field, threshold_value, actual_value, handler_name, deadline, status, resolution, owner_name, batch_id, remark, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ee.id, ee.code, ee.name, ee.exception_type, ee.severity, ee.source_entity_type, ee.source_entity_id, ee.trigger_field, ee.threshold_value, ee.actual_value, ee.handler_name, ee.deadline, ee.status, ee.resolution, ee.owner_name, ee.batch_id, ee.remark, now, now]
    );
  }

  await saveDatabase();
  console.log('Seed 数据导入完成');
  console.log(`- 会员权益: ${memberRights.length} 条`);
  console.log(`- 预约记录: ${bookingRecords.length} 条`);
  console.log(`- 航班时段: ${flightPeriods.length} 条`);
  console.log(`- 同行人: ${companions.length} 条`);
  console.log(`- 使用凭证: ${usageVouchers.length} 条`);
  console.log(`- 候补名单: ${waitingList.length} 条`);
  console.log(`- 核验结果: ${verificationResults.length} 条`);
  console.log(`- 状态流转: ${statusTransitions.length} 条`);
  console.log(`- 规则配置: ${ruleConfigs.length} 条`);
  console.log(`- 异常事件: ${exceptionEvents.length} 条`);
}
