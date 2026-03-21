import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';

const router = express.Router();

// POST /reports/generate
router.post('/generate', async (req, res) => {
  const { patientId, period, startDate, endDate } = req.body;

  if (!patientId || !period || !startDate || !endDate) {
    return res.status(400).json({ error: 'patientId, period, startDate, and endDate are required' });
  }

  if (!['daily', 'weekly', 'monthly'].includes(period)) {
    return res.status(400).json({ error: 'period must be daily, weekly, or monthly' });
  }

  // Verify patient exists
  const patient = await pb.collection('patients').getOne(patientId);
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  // Fetch care_updates for patient in date range
  const filter = `patient_id = "${patientId}" && created >= "${startDate}" && created <= "${endDate}"`;
  const updates = await pb.collection('care_updates').getFullList({
    filter,
  });

  // Aggregate by update_type
  const aggregated = {};
  updates.forEach((update) => {
    const type = update.update_type || 'unknown';
    if (!aggregated[type]) {
      aggregated[type] = { count: 0, details: [] };
    }
    aggregated[type].count += 1;
    aggregated[type].details.push({
      id: update.id,
      description: update.description,
      createdAt: update.created,
    });
  });

  const reportData = {
    patientId,
    period,
    startDate,
    endDate,
    totalUpdates: updates.length,
    byType: aggregated,
    generatedAt: new Date().toISOString(),
  };

  // Create care_reports record
  const report = await pb.collection('care_reports').create({
    patient_id: patientId,
    period,
    start_date: startDate,
    end_date: endDate,
    report_data: reportData,
  });

  logger.info(`Report generated for patient ${patientId}: ${report.id}`);

  res.json({ reportId: report.id, reportData });
});

// GET /reports/:reportId
router.get('/:reportId', async (req, res) => {
  const { reportId } = req.params;

  const report = await pb.collection('care_reports').getOne(reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  res.json({
    id: report.id,
    patientId: report.patient_id,
    period: report.period,
    reportData: report.report_data,
    generatedAt: report.created,
  });
});

// POST /reports/:reportId/export-pdf
router.post('/:reportId/export-pdf', async (req, res) => {
  const { reportId } = req.params;

  const report = await pb.collection('care_reports').getOne(reportId);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }

  const patient = await pb.collection('patients').getOne(report.patient_id);

  // TODO: Generate PDF using a library like pdfkit or html2pdf
  // Include: patient info, care summary, charts from report_data
  // For now, return placeholder response
  logger.info(`PDF export requested for report ${reportId}`);

  // Placeholder: return JSON instead of PDF
  res.json({
    message: 'PDF generation not yet implemented',
    reportId,
    patientName: patient.name,
    period: report.period,
  });
});

export default router;
