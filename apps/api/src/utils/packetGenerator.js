import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

const BRAND = 'Aide to Veterans, LLC';
const PAGE = { width: 612, height: 792 }; // US Letter
const MARGIN = 54;

async function newPage(pdfDoc, font, boldFont) {
  const page = pdfDoc.addPage([PAGE.width, PAGE.height]);
  let y = PAGE.height - MARGIN;

  page.drawText(BRAND, { x: MARGIN, y, size: 10, font: boldFont, color: rgb(0.1, 0.2, 0.4) });
  y -= 10;
  page.drawLine({
    start: { x: MARGIN, y }, end: { x: PAGE.width - MARGIN, y },
    thickness: 1, color: rgb(0.85, 0.85, 0.85),
  });
  y -= 24;

  return { page, y };
}

function drawWrapped(page, text, x, y, { font, size, maxWidth, lineHeight = size * 1.4 }) {
  const words = String(text ?? '').split(/\s+/);
  let line = '';
  let cursorY = y;
  for (const word of words) {
    const testLine = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(testLine, size) > maxWidth && line) {
      page.drawText(line, { x, y: cursorY, size, font });
      cursorY -= lineHeight;
      line = word;
    } else {
      line = testLine;
    }
  }
  if (line) {
    page.drawText(line, { x, y: cursorY, size, font });
    cursorY -= lineHeight;
  }
  return cursorY;
}

function fullName(vaCase) {
  return [vaCase.first_name, vaCase.last_name].filter(Boolean).join(' ') || 'Unknown Applicant';
}

async function buildCoverLetter(pdfDoc, font, boldFont, vaCase) {
  const { page, y: startY } = await newPage(pdfDoc, font, boldFont);
  let y = startY;

  page.drawText('VA Aid & Attendance Application', { x: MARGIN, y, size: 20, font: boldFont });
  y -= 28;
  page.drawText('Cover Letter', { x: MARGIN, y, size: 14, font, color: rgb(0.3, 0.3, 0.3) });
  y -= 40;

  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  page.drawText(`Date: ${today}`, { x: MARGIN, y, size: 11, font });
  y -= 20;
  page.drawText(`Applicant: ${fullName(vaCase)}`, { x: MARGIN, y, size: 11, font: boldFont });
  y -= 16;
  if (vaCase.va_file_number) {
    page.drawText(`VA File Number: ${vaCase.va_file_number}`, { x: MARGIN, y, size: 11, font });
    y -= 16;
  }
  page.drawText(`Status: Ready for VA Review`, { x: MARGIN, y, size: 11, font });
  y -= 40;

  y = drawWrapped(
    page,
    `Enclosed please find the VA Aid & Attendance application packet prepared by ${BRAND} on behalf of ` +
      `${fullName(vaCase)}. This packet includes the completed application forms and supporting ` +
      `documentation listed in the enclosed Document Checklist.`,
    MARGIN, y, { font, size: 11, maxWidth: PAGE.width - MARGIN * 2 },
  );
  y -= 20;
  y = drawWrapped(
    page,
    `Please contact our office with any questions regarding this submission.`,
    MARGIN, y, { font, size: 11, maxWidth: PAGE.width - MARGIN * 2 },
  );
}

async function buildDocumentChecklist(pdfDoc, font, boldFont, vaCase, caseForms) {
  const { page, y: startY } = await newPage(pdfDoc, font, boldFont);
  let y = startY;

  page.drawText('Document Checklist', { x: MARGIN, y, size: 18, font: boldFont });
  y -= 20;
  page.drawText(fullName(vaCase), { x: MARGIN, y, size: 12, font, color: rgb(0.3, 0.3, 0.3) });
  y -= 36;

  page.drawText('Included Documents:', { x: MARGIN, y, size: 12, font: boldFont });
  y -= 22;

  for (const cf of caseForms) {
    const formNumber = cf.expand?.form_id?.form_number || 'Unknown form';
    const title = cf.expand?.form_id?.title || '';
    const check = cf.status === 'filled' || cf.status === 'reviewed' || cf.status === 'submitted' ? '[x]' : '[ ]';
    page.drawText(`${check}  ${formNumber} — ${title}`, { x: MARGIN, y, size: 11, font });
    y -= 18;
  }
}

async function buildCaseSummary(pdfDoc, font, boldFont, vaCase, caseForms) {
  const { page, y: startY } = await newPage(pdfDoc, font, boldFont);
  let y = startY;

  page.drawText('Internal Case Summary', { x: MARGIN, y, size: 18, font: boldFont });
  y -= 16;
  page.drawText('For staff use only — not included in the client copy or VA submission.', {
    x: MARGIN, y, size: 9, font, color: rgb(0.6, 0.2, 0.2),
  });
  y -= 32;

  const rows = [
    ['Applicant', fullName(vaCase)],
    ['Applicant Type', vaCase.applicant_type === 'surviving_spouse' ? 'Surviving Spouse' : 'Veteran'],
    ['VA File Number', vaCase.va_file_number || '—'],
    ['Status', vaCase.status || '—'],
    ['Email', vaCase.email || '—'],
    ['Phone', vaCase.phone_area ? `(${vaCase.phone_area}) ${vaCase.phone_mid}-${vaCase.phone_last4}` : '—'],
    ['Mailing Address', vaCase.mailing_address_street || '—'],
  ];
  for (const [label, value] of rows) {
    page.drawText(`${label}:`, { x: MARGIN, y, size: 11, font: boldFont });
    page.drawText(String(value), { x: MARGIN + 160, y, size: 11, font });
    y -= 18;
  }
  y -= 12;

  page.drawText('Staff Review Checklist:', { x: MARGIN, y, size: 12, font: boldFont });
  y -= 20;
  const checklist = [
    ['checklist_correct_forms', 'Correct VA forms used'],
    ['checklist_info_verified', 'Veteran information verified'],
    ['checklist_signatures_obtained', 'Required signatures obtained'],
    ['checklist_medical_docs_attached', 'Medical documentation attached'],
    ['checklist_financial_docs_attached', 'Financial documents attached'],
    ['checklist_evidence_reviewed', 'Supporting evidence reviewed'],
    ['checklist_supervisor_approved', 'Final approval by supervisor'],
  ];
  for (const [key, label] of checklist) {
    const check = vaCase[key] ? '[x]' : '[ ]';
    page.drawText(`${check}  ${label}`, { x: MARGIN, y, size: 11, font });
    y -= 16;
  }
}

/**
 * Builds the full Aid & Attendance packet: generated cover letter, document
 * checklist, and internal case summary, merged with every filled VA form PDF
 * on the case. Returns the merged PDF as a Buffer.
 */
export async function generatePacket({ vaCase, caseForms, filledPdfBuffers }) {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  await buildCoverLetter(pdfDoc, font, boldFont, vaCase);
  await buildDocumentChecklist(pdfDoc, font, boldFont, vaCase, caseForms);
  await buildCaseSummary(pdfDoc, font, boldFont, vaCase, caseForms);

  for (const buf of filledPdfBuffers) {
    const formDoc = await PDFDocument.load(buf, { ignoreEncryption: true });
    const pages = await pdfDoc.copyPages(formDoc, formDoc.getPageIndices());
    pages.forEach((p) => pdfDoc.addPage(p));
  }

  return Buffer.from(await pdfDoc.save());
}
