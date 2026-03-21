import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Middleware to check admin role (basic implementation)
const requireAdmin = async (req, res, next) => {
  // TODO: Implement proper authentication and role checking
  // For now, assume admin if userId is provided
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// POST /audit-logs
router.post('/', async (req, res) => {
  const { userId, action, resourceType, resourceId } = req.body;

  if (!userId || !action || !resourceType) {
    return res.status(400).json({ error: 'userId, action, and resourceType are required' });
  }

  const log = await pb.collection('audit_logs').create({
    user_id: userId,
    action,
    resource_type: resourceType,
    resource_id: resourceId || null,
    timestamp: new Date().toISOString(),
  });

  logger.info(`Audit log created: ${action} on ${resourceType} by ${userId}`);

  res.json({ success: true, logId: log.id });
});

// GET /audit-logs
router.get('/', requireAdmin, async (req, res) => {
  const { startDate, endDate, userId, action, resourceType, page = 1, limit = 50 } = req.query;

  let filter = '';
  const filters = [];

  if (startDate) filters.push(`timestamp >= "${startDate}"`);
  if (endDate) filters.push(`timestamp <= "${endDate}"`);
  if (userId) filters.push(`user_id = "${userId}"`);
  if (action) filters.push(`action = "${action}"`);
  if (resourceType) filters.push(`resource_type = "${resourceType}"`);

  filter = filters.join(' && ');

  const logs = await pb.collection('audit_logs').getList(page, limit, {
    filter,
    sort: '-timestamp',
  });

  res.json({
    items: logs.items,
    page: logs.page,
    perPage: logs.perPage,
    totalItems: logs.totalItems,
    totalPages: logs.totalPages,
  });
});

export default router;
