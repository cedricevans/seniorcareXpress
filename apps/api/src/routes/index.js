import { Router } from 'express';
import healthCheck from './health-check.js';
import authRouter from './auth.js';
import videoCallsRouter from './video-calls.js';
import reportsRouter from './reports.js';
import auditLogsRouter from './audit-logs.js';
import vaFormsRouter from './va-forms.js';
import packetsRouter from './packets.js';

const router = Router();

export default () => {
  router.get('/health', healthCheck);
  router.use('/auth', authRouter);
  router.use('/video-calls', videoCallsRouter);
  router.use('/reports', reportsRouter);
  router.use('/audit-logs', auditLogsRouter);
  router.use('/va-forms', vaFormsRouter);
  router.use('/packets', packetsRouter);

  return router;
};
