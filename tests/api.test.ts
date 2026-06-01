import request from 'supertest';
import app from '../src/app';

describe('API 健康检查', () => {
  test('GET /api/health 应返回健康状态', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
    expect(response.body.service).toContain('机场贵宾厅');
  });

  test('GET /api 应返回 API 信息', async () => {
    const response = await request(app)
      .get('/api')
      .expect(200);
    
    expect(response.body.name).toBeDefined();
    expect(response.body.version).toBe('1.0.0');
    expect(response.body.endpoints).toBeDefined();
  });
});

describe('会员权益 API', () => {
  test('GET /api/member-rights 应返回会员权益列表', async () => {
    const response = await request(app)
      .get('/api/member-rights')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('POST /api/member-rights 应创建新会员权益', async () => {
    const newMember = {
      code: `MR-TEST-${Date.now()}`,
      name: '测试会员权益',
      member_level: 'gold',
      valid_from: '2024-01-01',
      valid_to: '2025-12-31',
      total_quota: 8,
      remaining_quota: 8
    };

    const response = await request(app)
      .post('/api/member-rights')
      .send(newMember)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.code).toBe(newMember.code);
    expect(response.body.data.member_level).toBe('gold');
  });
});

describe('预约记录 API', () => {
  test('GET /api/booking-records 应返回预约列表', async () => {
    const response = await request(app)
      .get('/api/booking-records')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('航班时段 API', () => {
  test('GET /api/flight-periods 应返回航班时段列表', async () => {
    const response = await request(app)
      .get('/api/flight-periods')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});

describe('异常事件 API', () => {
  test('GET /api/exception-events 应返回异常事件列表', async () => {
    const response = await request(app)
      .get('/api/exception-events')
      .expect(200);
    
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });
});
