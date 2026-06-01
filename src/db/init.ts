import { getDatabase, saveDatabase } from './database';

export async function initDatabase() {
  const db = await getDatabase();
  
  db.run(`
    CREATE TABLE IF NOT EXISTS member_rights (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      member_level TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      remaining_quota INTEGER DEFAULT 0,
      total_quota INTEGER DEFAULT 0,
      valid_from TEXT NOT NULL,
      valid_to TEXT NOT NULL,
      owner_name TEXT,
      batch_id TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS booking_records (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      member_id TEXT,
      flight_number TEXT,
      flight_date TEXT,
      lounge_id TEXT,
      status TEXT DEFAULT 'draft',
      companion_count INTEGER DEFAULT 0,
      owner_name TEXT,
      batch_id TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES member_rights(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS flight_periods (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      flight_number TEXT NOT NULL,
      departure_time TEXT NOT NULL,
      arrival_time TEXT,
      airport_code TEXT NOT NULL,
      terminal TEXT,
      status TEXT DEFAULT 'scheduled',
      capacity INTEGER DEFAULT 50,
      used_count INTEGER DEFAULT 0,
      owner_name TEXT,
      batch_id TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS companions (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      booking_id TEXT,
      id_type TEXT,
      id_number TEXT,
      relationship TEXT,
      status TEXT DEFAULT 'pending',
      is_verified INTEGER DEFAULT 0,
      owner_name TEXT,
      batch_id TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES booking_records(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS usage_vouchers (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      voucher_type TEXT NOT NULL,
      booking_id TEXT,
      member_id TEXT,
      status TEXT DEFAULT 'valid',
      issued_at TEXT,
      used_at TEXT,
      expire_at TEXT,
      owner_name TEXT,
      batch_id TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (booking_id) REFERENCES booking_records(id),
      FOREIGN KEY (member_id) REFERENCES member_rights(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS waiting_list (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      member_id TEXT,
      booking_id TEXT,
      priority_score REAL DEFAULT 0,
      wait_start_time TEXT NOT NULL,
      estimated_wait_minutes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'waiting',
      position INTEGER DEFAULT 0,
      owner_name TEXT,
      batch_id TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES member_rights(id),
      FOREIGN KEY (booking_id) REFERENCES booking_records(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS verification_results (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      member_id TEXT,
      booking_id TEXT,
      verification_type TEXT NOT NULL,
      result TEXT NOT NULL,
      score REAL DEFAULT 0,
      rule_violations TEXT,
      exception_flags TEXT,
      status TEXT DEFAULT 'pending_review',
      reviewer_name TEXT,
      review_time TEXT,
      owner_name TEXT,
      batch_id TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (member_id) REFERENCES member_rights(id),
      FOREIGN KEY (booking_id) REFERENCES booking_records(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS status_transitions (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      from_status TEXT,
      to_status TEXT NOT NULL,
      action TEXT NOT NULL,
      reason TEXT,
      operator_name TEXT,
      owner_name TEXT,
      batch_id TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS rule_configs (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      rule_category TEXT NOT NULL,
      rule_key TEXT NOT NULL,
      rule_value TEXT,
      threshold_value REAL,
      priority INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      owner_name TEXT,
      batch_id TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS exception_events (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      exception_type TEXT NOT NULL,
      severity TEXT DEFAULT 'medium',
      source_entity_type TEXT,
      source_entity_id TEXT,
      trigger_field TEXT,
      threshold_value TEXT,
      actual_value TEXT,
      handler_name TEXT,
      deadline TEXT,
      status TEXT DEFAULT 'open',
      resolution TEXT,
      owner_name TEXT,
      batch_id TEXT,
      remark TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_member_rights_code ON member_rights(code);
    CREATE INDEX IF NOT EXISTS idx_member_rights_status ON member_rights(status);
    CREATE INDEX IF NOT EXISTS idx_member_rights_level ON member_rights(member_level);
    CREATE INDEX IF NOT EXISTS idx_booking_records_code ON booking_records(code);
    CREATE INDEX IF NOT EXISTS idx_booking_records_status ON booking_records(status);
    CREATE INDEX IF NOT EXISTS idx_booking_records_member ON booking_records(member_id);
    CREATE INDEX IF NOT EXISTS idx_flight_periods_flight ON flight_periods(flight_number);
    CREATE INDEX IF NOT EXISTS idx_flight_periods_airport ON flight_periods(airport_code);
    CREATE INDEX IF NOT EXISTS idx_companions_booking ON companions(booking_id);
    CREATE INDEX IF NOT EXISTS idx_usage_vouchers_booking ON usage_vouchers(booking_id);
    CREATE INDEX IF NOT EXISTS idx_waiting_list_member ON waiting_list(member_id);
    CREATE INDEX IF NOT EXISTS idx_waiting_list_status ON waiting_list(status);
    CREATE INDEX IF NOT EXISTS idx_verification_results_member ON verification_results(member_id);
    CREATE INDEX IF NOT EXISTS idx_exception_events_status ON exception_events(status);
    CREATE INDEX IF NOT EXISTS idx_status_transitions_entity ON status_transitions(entity_type, entity_id);
  `);

  await saveDatabase();
  console.log('数据库初始化完成');
}
