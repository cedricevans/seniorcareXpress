import express from 'express';
import pb from '../utils/pocketbaseClient.js';
import logger from '../utils/logger.js';
import { fillPdfForm } from '../utils/pdfFormFill.js';

const router = express.Router();

// POST /va-forms/:caseFormId/fill
router.post('/:caseFormId/fill', async (req, res) => {
  const { caseFormId } = req.params;

  const caseForm = await pb.collection('va_case_forms').getOne(caseFormId, {
    expand: 'case_id,form_id',
  });

  const vaCase = caseForm.expand?.case_id;
  const vaForm = caseForm.expand?.form_id;

  if (!vaCase || !vaForm) {
    return res.status(404).json({ error: 'Case or form not found' });
  }
  if (!vaForm.pdf_file) {
    return res.status(400).json({ error: 'This form has no PDF template uploaded yet' });
  }
  if (!vaForm.field_map || Object.keys(vaForm.field_map).length === 0) {
    return res.status(400).json({ error: 'This form has no field_map defined yet' });
  }

  // Identity data lives on va_cases (shared across forms); form-specific data
  // (e.g. nursing home info for 21-0779) lives on va_case_forms itself.
  // expense_report_data holds 21P-8416's dynamic-row fields as a flat object
  // keyed the same way as its field_map (in_home_a_whose, addendum_b_row3_purpose, etc.).
  const values = { ...vaCase, ...caseForm, ...(caseForm.expense_report_data || {}) };

  const pdfUrl = pb.files.getURL(vaForm, vaForm.pdf_file);
  const pdfBytes = await fetch(pdfUrl).then((r) => r.arrayBuffer());

  const filledPdfBytes = await fillPdfForm(Buffer.from(pdfBytes), vaForm.field_map, values);

  const formData = new FormData();
  formData.append('status', 'filled');
  formData.append(
    'filled_pdf',
    new Blob([filledPdfBytes], { type: 'application/pdf' }),
    `${vaForm.form_number}-filled.pdf`,
  );

  const updated = await pb.collection('va_case_forms').update(caseFormId, formData);

  logger.info(`Filled VA form ${vaForm.form_number} for case ${vaCase.id}`);

  res.json(updated);
});

export default router;
