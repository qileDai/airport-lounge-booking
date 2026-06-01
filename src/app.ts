import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { errorHandler } from './utils/apiResponse';
import { initDatabase } from './db/init';

import memberRightsRoutes from './routes/memberRights.routes';
import bookingRecordRoutes from './routes/bookingRecord.routes';
import flightPeriodRoutes from './routes/flightPeriod.routes';
import companionRoutes from './routes/companion.routes';
import usageVoucherRoutes from './routes/usageVoucher.routes';
import waitingListRoutes from './routes/waitingList.routes';
import verificationResultRoutes from './routes/verificationResult.routes';
import statusTransitionRoutes from './routes/statusTransition.routes';
import exceptionEventRoutes from './routes/exceptionEvent.routes';
import statisticsRoutes from './routes/statistics.routes';
import ruleConfigRoutes from './routes/ruleConfig.routes';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: '机场贵宾厅预约权益核验规则计算 API 服务',
    version: '1.0.0'
  });
});

app.get('/api', (req, res) => {
  res.json({
    name: '机场贵宾厅预约权益核验规则计算 API 服务',
    version: '1.0.0',
    description: 'Airport Lounge Booking Rights Verification & Calculation API Service',
    endpoints: {
      memberRights: '/api/member-rights',
      bookingRecords: '/api/booking-records',
      flightPeriods: '/api/flight-periods',
      companions: '/api/companions',
      usageVouchers: '/api/usage-vouchers',
      waitingList: '/api/waiting-list',
      verificationResults: '/api/verification-results',
      statusTransitions: '/api/status-transitions',
      exceptionEvents: '/api/exception-events',
      statistics: '/api/statistics',
      ruleConfigs: '/api/rule-configs'
    },
    documentation: '详见 README.md'
  });
});

app.use('/api/member-rights', memberRightsRoutes);
app.use('/api/booking-records', bookingRecordRoutes);
app.use('/api/flight-periods', flightPeriodRoutes);
app.use('/api/companions', companionRoutes);
app.use('/api/usage-vouchers', usageVoucherRoutes);
app.use('/api/waiting-list', waitingListRoutes);
app.use('/api/verification-results', verificationResultRoutes);
app.use('/api/status-transitions', statusTransitionRoutes);
app.use('/api/exception-events', exceptionEventRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/rule-configs', ruleConfigRoutes);

app.use(errorHandler);

async function startServer() {
  try {
    console.log('正在初始化数据库...');
    await initDatabase();
    
    app.listen(PORT, () => {
      console.log(`
╔══════════════════════════════════════════════════╗
║     机场贵宾厅预约权益核验规则计算 API 服务       ║
║   Airport Lounge Booking Rights Verification     ║
║              & Calculation Service               ║
╠══════════════════════════════════════════════════╣
║  ✅ 服务器已启动                                  ║
║  📍 http://localhost:${PORT}                        ║
║  📊 健康检查: http://localhost:${PORT}/api/health    ║
║  📖 API 文档: http://localhost:${PORT}/api           ║
╚══════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();

export default app;
