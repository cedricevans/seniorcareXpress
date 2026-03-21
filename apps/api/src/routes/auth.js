import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import { generateInviteCode } from '../utils/generateCode.js';
import { setCache } from '../utils/cache.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /auth/invite-caregiver
router.post('/invite-caregiver', async (req, res) => {
  const { email, name, phone, certifications } = req.body;

  if (!email || !name) {
    return res.status(400).json({ error: 'Email and name are required' });
  }

  const inviteCode = generateInviteCode();

  // Store in cache with 24-hour TTL
  setCache(`caregiver_invite_${inviteCode}`, {
    email,
    name,
    phone,
    certifications,
    createdAt: new Date().toISOString(),
  });

  // TODO: Send email via PocketBase hooks or built-in mailer
  // Email should contain: invite link with code, name, certifications info
  logger.info(`Caregiver invite created for ${email} with code ${inviteCode}`);

  res.json({ success: true, inviteCode });
});

// POST /auth/invite-family
router.post('/invite-family', async (req, res) => {
  const { familyEmail, patientId, relationship } = req.body;

  if (!familyEmail || !patientId || !relationship) {
    return res.status(400).json({ error: 'familyEmail, patientId, and relationship are required' });
  }

  // Verify patient exists
  const patient = await pb.collection('patients').getOne(patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const inviteCode = generateInviteCode();

  // Store in cache with 24-hour TTL
  setCache(`family_invite_${inviteCode}`, {
    familyEmail,
    patientId,
    relationship,
    createdAt: new Date().toISOString(),
  });

  // TODO: Send email via PocketBase hooks or built-in mailer
  // Email should contain: login link with code, patient name, relationship info
  logger.info(`Family invite created for ${familyEmail} (patient: ${patientId}) with code ${inviteCode}`);

  res.json({ success: true, inviteCode });
});

export default router;
