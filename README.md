# 机场贵宾厅预约权益核验规则计算 API 服务

## Airport Lounge Booking Rights Verification & Calculation Service

### 项目简介

这是一个面向**权益运营、机场服务台、客服支持**人员的纯后端 REST API 服务，专注于**机场贵宾厅预约权益核验**业务场景。

本系统围绕以下核心对象设计：
- **会员权益**（Member Rights）
- **预约记录**（Booking Records）
- **航班时段**（Flight Periods）
- **同行人**（Companions）
- **使用凭证**（Usage Vouchers）
- **候补名单**（Waiting List）
- **核验结果**（Verification Results）
- **异常事件**（Exception Events）

### 核心功能

✅ **1. 会员权益数据模型与 CRUD API**
- 会员等级管理（白金/金/银卡）
- 权益额度管理
- 有效期管理
- 状态管理（活跃/过期/暂停/取消）

✅ **2. 预约记录批量导入预检 API**
- 批量导入前自动校验
- 检测必填字段缺失
- 检测关联数据有效性
- 提供错误和警告信息

✅ **3. 核验权益资格领域服务**
- 校验会员权益状态
- 检查有效期和额度
- 验证航班信息完整性
- 计算核验评分

✅ **4. 安排候补入场计算服务**
- 基于优先级的公平排队
- 自动计算排队位置
- 批量入场处理
- 候补通知机制

✅ **5. 权益过期异常判定 API**
- 自动检测权益过期
- 异常事件自动生成
- 处理时限跟踪
- 异常升级机制

✅ **6. 权益核验通过率聚合统计 API**
- 按日/批次/责任角色聚合
- 通过率、驳回率、待补充率统计
- 使用率分析
- 明细数据追溯

✅ **7. 航班时段归档与快照 API**
- 过期时段自动归档
- 时段快照保存
- 利用率报告
- 高峰/低谷期识别

✅ **8. 入场优先级计算 API**
- 综合考虑会员等级、剩余额度、航班时间、等待时间
- 动态权重配置
- 实时排序更新
- 入场推荐建议

✅ **9. 审计日志和操作追踪 API**
- 完整状态变更记录
- 操作人员追踪
- 变更原因记录
- 历史查询支持

✅ **10. 接口测试脚本与 HTTP 样本**
- Jest 单元测试
- HTTP 样本文件
- curl 命令样本

### 技术栈

- **运行时**: Node.js 18+
- **框架**: Express 4.x
- **语言**: TypeScript 5.x
- **数据库**: SQLite (sql.js)
- **测试**: Jest + supertest

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装依赖

```bash
npm install
```

### 初始化数据库

```bash
npm run init-db
```

这将：
- 创建所有表结构
- 创建索引以优化查询性能

### 导入 Seed 数据

```bash
npm run seed
```

这将导入 **50+ 条真实业务场景的样本数据**，包括：
- 5 条会员权益记录（覆盖白金/金/银卡，包含正常、过期、暂停状态）
- 6 条预约记录（覆盖草稿、待复核、已确认、已驳回、待补充、已归档状态）
- 5 条航班时段记录
- 7 条同行人记录
- 6 条使用凭证记录
- 5 条候补名单记录
- 6 条核验结果记录
- 6 条状态流转记录
- 6 条规则配置记录
- 5 条异常事件记录

### 启动开发服务器

```bash
npm run dev
```

服务器将在 http://localhost:3000 启动

### 运行测试

```bash
# 运行所有测试
npm test

# 运行测试（监听模式）
npm run test:watch
```

## REST API 端点

### 基础端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api` | API 信息 |

### 1. 会员权益 API (`/api/member-rights`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取列表（分页） |
| GET | `/:id` | 获取详情 |
| GET | `/code/:code` | 按编号查询 |
| POST | `/` | 创建 |
| PUT | `/:id` | 更新 |
| DELETE | `/:id` | 删除 |
| GET | `/status/:status` | 按状态查询 |
| GET | `/level/:level` | 按等级查询 |
| GET | `/:id/expiry-check` | 过期检查 |

### 2. 预约记录 API (`/api/booking-records`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取列表 |
| GET | `/:id` | 获取详情 |
| POST | `/` | 创建 |
| PUT | `/:id` | 更新 |
| DELETE | `/:id` | 删除 |
| POST | `/batch-import/precheck` | **批量预检** |
| GET | `/:id/eligibility-verify` | **资格核验** |

### 3. 航班时段 API (`/api/flight-periods`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取列表 |
| GET | `/:id` | 获取详情 |
| POST | `/` | 创建 |
| PUT | `/:id` | 更新 |
| DELETE | `/:id` | 删除 |
| POST | `/archive/expired` | **归档过期时段** |
| GET | `/:id/snapshot` | **创建快照** |
| GET | `/reports/utilization` | **利用率报告** |

### 4. 候补名单 API (`/api/waiting-list`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取列表 |
| POST | `/` | 加入候补 |
| DELETE | `/:id` | 移除候补 |
| GET | `/member/:memberId/position` | 排队位置 |
| POST | `/admission/process` | **处理入场** |
| POST | `/priority/calculate-all` | **批量计算优先级** |
| POST | `/priority/calculate/:memberId` | **计算优先级** |
| POST | `/admission/auto-admit` | **自动通知入场** |

### 5. 异常事件 API (`/api/exception-events`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/` | 获取列表 |
| GET | `/open` | 未处理异常 |
| GET | `/:id` | 获取详情 |
| POST | `/` | 创建 |
| PUT | `/:id` | 更新 |
| GET | `/statistics/summary` | **统计摘要** |
| POST | `/check/member/:memberId` | **检测异常** |
| POST | `/check/batch-expiry` | **批量检测过期** |

### 6. 状态流转 API (`/api/status-transitions`)

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/` | **执行状态流转** |
| GET | `/audit-log` | **审计日志** |
| GET | `/history/:entityType/:entityId` | **变更历史** |
| GET | `/allowed-transitions/:type/:status` | **允许的转换** |

### 7. 统计聚合 API (`/api/statistics`)

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/verification` | **核验通过率统计** |
| GET | `/usage-rate` | **使用率统计** |
| GET | `/daily/:date` | **每日汇总** |

### 其他实体 API

| 实体 | 路径 | CRUD 支持 |
|------|------|-----------|
| 同行人 | `/api/companions` | ✅ |
| 使用凭证 | `/api/usage-vouchers` | ✅ |
| 核验结果 | `/api/verification-results` | ✅ |
| 规则配置 | `/api/rule-configs` | ✅ |

**总计: 50+ 个 REST API 端点**

## 核心业务规则

### 规则 1: 入场优先级计算

根据以下因素综合计算：
- **会员等级权重**: 白金(100) > 金卡(75) > 银卡(50)
- **剩余额度因子**: 占比越高分数越高
- **航班时间紧迫度**: 越临近起飞分值越高
- **等待时间**: 等待越久分值越高（指数衰减）

**公式**:
```
总分 = 等级分×0.35 + 额度分×0.25 + 时间分×0.20 + 等待分×0.20
```

### 规则 2: 权益过期异常处理

当检测到权益过期时：
1. ✅ 自动进入异常队列
2. ✅ 记录触发字段（valid_to）
3. ✅ 记录阈值和实际值
4. ✅ 分配处理人
5. ✅ 设置处理时限（高严重性2小时，中严重性24小时）
6. ✅ 自动触发状态变更为"expired"

### 规则 3: 核验一致性校验

核验前必须验证：
- [x] 会员权益存在且有效
- [x] 预约记录关联正确
- [x] 航班信息完整
- [ ] 缺少关键字段时只允许保存草稿，不允许正式提交

### 规则 4: 统计聚合维度

支持按以下维度聚合统计：
- **日期**: 日/周/月/年
- **批次**: batch_id
- **责任角色**: owner_name
- **状态分布**: 各状态占比
- **明细追溯**: 支持查看原始记录

### 规则 5: 状态流转限制

合法的状态转换路径：

**预约记录**:
```
draft → pending_review → confirmed → archived
                     → rejected
                     → supplement_required → pending_review
```

**核验结果**:
```
draft → pending_review → confirmed → archived
                      → rejected → archived
                      → supplement_required → pending_review
```

**特殊规则**:
- ❌ 驳回(rejected)必须填写原因
- ❌ 已归档(archived)不可再变更
- ❌ 已确认(confirmed)只能归档

## 使用样本

### cURL 样本

#### 1. 查询健康状态
```bash
curl -X GET http://localhost:3000/api/health
```

#### 2. 获取会员权益列表
```bash
curl -X GET "http://localhost:3000/api/member-rights?page=1&limit=10"
```

#### 3. 创建会员权益
```bash
curl -X POST http://localhost:3000/api/member-rights \
  -H "Content-Type: application/json" \
  -d '{
    "code": "MR-2024-NEW-001",
    "name": "新增贵宾厅权益",
    "member_level": "platinum",
    "valid_from": "2024-06-01",
    "valid_to": "2025-05-31",
    "total_quota": 12,
    "remaining_quota": 12,
    "owner_name": "管理员A"
  }'
```

#### 4. 批量导入预检
```bash
curl -X POST http://localhost:3000/api/booking-records/batch-import/precheck \
  -H "Content-Type: application/json" \
  -d '{
    "records": [
      {
        "code": "BK-BATCH-001",
        "name": "张三预约",
        "flight_number": "CA1234",
        "flight_date": "2024-12-20T08:30:00Z"
      },
      {
        "code": "BK-BATCH-002",
        "name": "李四预约"
      }
    ]
  }'
```

#### 5. 核验预约资格
```bash
curl -X GET http://localhost:3000/api/booking-records/{{booking_id}}/eligibility-verify
```

#### 6. 计算入场优先级
```bash
curl -X POST http://localhost:3000/api/waiting-list/priority/calculate/{{member_id}} \
  -H "Content-Type: application/json" \
  -d '{
    "flight_period_id": "{{period_id}}"
  }'
```

#### 7. 执行状态流转（驳回样本）
```bash
curl -X POST http://localhost:3000/api/status-transitions \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "booking_record",
    "entity_id": "{{booking_id}}",
    "from_status": "pending_review",
    "to_status": "rejected",
    "action": "reject_booking",
    "operator_name": "审核员B",
    "reason": "缺少必要信息，请补充后重新提交"
  }'
```

#### 8. 查询统计信息
```bash
# 核验通过率统计
curl -X GET "http://localhost:3000/api/statistics/verification?startDate=2024-01-01"

# 使用率统计
curl -X GET http://localhost:3000/api/statistics/usage-rate

# 每日汇总
curl -X GET http://localhost:3000/api/statistics/daily/2024-01-20
```

#### 9. 检测异常
```bash
# 检测单个会员异常
curl -X POST http://localhost:3000/api/exception-events/check/member/{{member_id}}

# 批量检测过期异常
curl -X POST http://localhost:3000/api/exception-events/check/batch-expiry
```

#### 10. 处理候补入场
```bash
curl -X POST http://localhost:3000/api/waiting-list/admission/process \
  -H "Content-Type: application/json" \
  -d '{
    "flightPeriodId": "{{period_id}}",
    "availableSlots": 3
  }'
```

## Seed 数据说明

系统提供 **50+ 条贴近真实业务的样本数据**：

### 数据特点

1. **真实性**: 使用真实的编号格式（如 MR-2024-PEK-001, BK-20240115-001）
2. **多样性**: 覆盖不同机场（PEK/PVG/CAN/SZX/CTU）、航站楼、航班号
3. **完整性**: 包含完整的时间戳、负责人、批次信息
4. **状态覆盖**:
   - ✅ 正常状态（active, confirmed, verified）
   - ⚠️ 待处理状态（pending_review, supplement_required, waiting）
   - ❌ 异常状态（expired, suspended, rejected）
   - 📁 已完结状态（archived, resolved）

### 数据量统计

| 实体类型 | 数量 | 状态分布 |
|---------|------|---------|
| 会员权益 | 5 | active(3), expired(1), suspended(1) |
| 预约记录 | 6 | draft(1), pending_review(1), confirmed(1), rejected(1), supplement_required(1), archived(1) |
| 航班时段 | 5 | scheduled(4), archived(1) |
| 同行人 | 7 | verified(5), pending(1), rejected(1) |
| 使用凭证 | 6 | valid(1), used(2), voided(1), frozen(1), pending_issue(1) |
| 候补名单 | 5 | waiting(2), notified(1), cancelled(1) |
| 核验结果 | 6 | passed(2), warning(1), draft(1), failed(1), suspended(1) |
| 状态流转 | 6 | 多种操作类型 |
| 规则配置 | 6 | 全部激活 |
| 异常事件 | 5 | open(2), in_progress(1), resolved(1), closed(1) |

## 开发指南

### 添加新的实体

1. 在 `src/models/entities.ts` 定义接口
2. 在 `src/schemas/` 创建 DTO
3. 在 `src/repositories/` 创建 Repository
4. 在 `src/services/` 创建 Service
5. 在 `src/routes/` 创建路由
6. 在 `src/app.ts` 注册路由
7. 在 `src/db/init.ts` 添加建表语句
8. 编写测试用例

### 添加新的领域规则

1. 在对应的 Service 中实现规则逻辑
2. 如需配置化，在 rule_configs 表添加配置
3. 编写单元测试验证规则
4. 更新文档说明

## 测试

### 运行所有测试
```bash
npm test
```

### 测试覆盖率目标
- Service 层: ≥ 80%
- Repository 层: ≥ 70%
- API 路由: ≥ 60%

### 测试文件位置
- API 测试: `tests/api.test.ts`
- 服务层测试: `tests/service.test.ts`
- HTTP 样本: `tests/api-examples.http`

## 性能优化建议

1. **索引优化**: 已为常用查询字段创建索引
2. **分页查询**: 所有列表接口支持分页
3. **批量操作**: 支持批量导入和批量计算
4. **缓存策略**: 可考虑引入 Redis 缓存热点数据
5. **数据库分离**: 生产环境建议使用 MySQL/PostgreSQL

## 故障排查

### 常见问题

**Q: 启动时提示数据库初始化失败？**
A: 确保 `data/` 目录存在且有写入权限，或先运行 `npm run init-db`

**Q: Seed 数据导入失败？**

**Q: 测试失败？**
A: 检查依赖是否完整安装，确保数据库有 seed 数据

**Q: 端口被占用？**
A: 修改 `src/app.ts` 中的 PORT 或设置环境变量 `PORT=3001`

## 版本历史

### v1.0.0 (2024-01)
- 初始版本发布
- 实现 10 个核心实体的 CRUD
- 实现 8 个核心功能模块
- 提供 50+ 个 REST API 端点
- 导入 50+ 条 seed 样本数据
- 完整的测试套件

## 贡献指南

欢迎提交 Issue 和 Pull Request！
