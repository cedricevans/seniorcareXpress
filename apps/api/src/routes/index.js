import { Router } from 'express';
import healthCheck from './health-check.js';
import authRouter from './auth.js';
import videoCallsRouter from './video-calls.js';
import reportsRouter from './reports.js';
import auditLogsRouter from './audit-logs.js';

const router = Router();

export default () => {
  router.get('/health', healthCheck);
  router.use('/auth', authRouter);
  router.use('/video-calls', videoCallsRouter);
  router.use('/reports', reportsRouter);
  router.use('/audit-logs', auditLogsRouter);

  return router;
};
