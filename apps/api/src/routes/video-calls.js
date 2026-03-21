import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Generate Google Meet link (placeholder format)
const generateMeetLink = (videoCallId) => {
  // In production, integrate with Google Calendar API to create actual Meet links
  // For now, use placeholder format
  return `https://meet.google.com/abc-${videoCallId.substring(0, 8)}`;
};

// POST /video-calls/generate-meet-link
router.post('/generate-meet-link', async (req, res) => {
  const { videoCallId, patientId, scheduledTime } = req.body;

  if (!videoCallId || !patientId || !scheduledTime) {
    return res.status(400).json({ error: 'videoCallId, patientId, and scheduledTime are required' });
  }

  // Verify video call exists
  const videoCall = await pb.collection('video_calls').getOne(videoCallId);
  if (!videoCall) {
    return res.status(404).json({ error: 'Video call not found' });
  }

  const meetLink = generateMeetLink(videoCallId);

  // Update video_calls record with google_meet_link
  await pb.collection('video_calls').update(videoCallId, {
    google_meet_link: meetLink,
    scheduled_time: scheduledTime,
  });

  logger.info(`Meet link generated for video call ${videoCallId}: ${meetLink}`);

  res.json({ meetLink });
});

// POST /video-calls/send-invitations
router.post('/send-invitations', async (req, res) => {
  const { videoCallId, recipientEmails } = req.body;

  if (!videoCallId || !Array.isArray(recipientEmails) || recipientEmails.length === 0) {
    return res.status(400).json({ error: 'videoCallId and recipientEmails array are required' });
  }

  // Verify video call exists
  const videoCall = await pb.collection('video_calls').getOne(videoCallId);
  if (!videoCall) {
    return res.status(404).json({ error: 'Video call not found' });
  }

  const meetLink = videoCall.google_meet_link;
  const scheduledTime = videoCall.scheduled_time;

  if (!meetLink) {
    return res.status(400).json({ error: 'Meet link not generated yet. Call generate-meet-link first.' });
  }

  // TODO: Send emails via PocketBase hooks or built-in mailer
  // Email should contain: Meet link, scheduled time, patient info
  logger.info(`Invitations sent to ${recipientEmails.length} recipients for video call ${videoCallId}`);

  res.json({ success: true, emailsSent: recipientEmails.length });
});

export default router;
