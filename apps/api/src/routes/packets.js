import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { generatePacket } from '../utils/packetGenerator.js';

const router = express.Router();

// POST /packets/:caseId/generate
router.post('/:caseId/generate', async (req, res) => {
  const { caseId } = req.params;

  const vaCase = await pb.collection('va_cases').getOne(caseId);

  const checklistKeys = [
    'checklist_correct_forms', 'checklist_info_verified', 'checklist_signatures_obtained',
    'checklist_medical_docs_attached', 'checklist_financial_docs_attached',
    'checklist_evidence_reviewed', 'checklist_supervisor_approved',
  ];
  const incomplete = checklistKeys.some((k) => !vaCase[k]);
  if (incomplete) {
    return res.status(400).json({ error: 'Staff review checklist is not complete for this case' });
  }

  const caseForms = await pb.collection('va_case_forms').getFullList({
    filter: `case_id = "${caseId}"`,
    expand: 'form_id',
  });

  const filledForms = caseForms.filter((cf) => cf.filled_pdf);
  const filledPdfBuffers = await Promise.all(
    filledForms.map(async (cf) => {
      const url = pb.files.getURL(cf, cf.filled_pdf);
      const bytes = await fetch(url).then((r) => r.arrayBuffer());
      return Buffer.from(bytes);
    }),
  );

  const packetBytes = await generatePacket({ vaCase, caseForms, filledPdfBuffers });

  const formData = new FormData();
  formData.append(
    'packet_pdf',
    new Blob([packetBytes], { type: 'application/pdf' }),
    `${vaCase.last_name || 'case'}-aid-attendance-packet.pdf`,
  );

  const updated = await pb.collection('va_cases').update(caseId, formData);

  logger.info(`Generated Aid & Attendance packet for case ${caseId}`);

  res.json(updated);
});

export default router;
