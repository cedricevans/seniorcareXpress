const BRAND_LOGO_URL = 'https://horizons-cdn.hostinger.com/0f92c1a5-75e3-4878-84c5-4c29eda99ea0/6cf179a531307fd05365d487c05a8a26.png';
const PRIMARY_RGB = [13, 36, 71]; // matches --primary (215 85% 25%)
const SECONDARY_RGB = [232, 180, 56]; // matches --secondary (42 90% 55%)
const TEXT_RGB = [40, 40, 45];
const MUTED_RGB = [110, 116, 128];

const PAGE_WIDTH = 612; // letter, pt
const PAGE_HEIGHT = 792;
const MARGIN_X = 54;
const HEADER_HEIGHT = 86;
const FOOTER_HEIGHT = 40;
const CONTENT_TOP = HEADER_HEIGHT + 24;
const CONTENT_BOTTOM = PAGE_HEIGHT - FOOTER_HEIGHT - 20;

async function loadImageAsDataUrl(url) {
  const res = await fetch(url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function fmtDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtMoney(value) {
  if (value === '' || value === null || value === undefined) return '—';
  const n = Number(value);
  if (Number.isNaN(n)) return value;
  return `$${n.toFixed(2)}`;
}

export async function generateServiceAgreementPdf(data) {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ unit: 'pt', format: 'letter' });

  let logoDataUrl = null;
  try {
    logoDataUrl = await loadImageAsDataUrl(BRAND_LOGO_URL);
  } catch {
    logoDataUrl = null;
  }

  let y = CONTENT_TOP;
  let pageNum = 1;

  const drawHeader = () => {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT, 'F');
    pdf.setDrawColor(225, 227, 232);
    pdf.line(0, HEADER_HEIGHT, PAGE_WIDTH, HEADER_HEIGHT);
    pdf.setFillColor(...SECONDARY_RGB);
    pdf.rect(0, HEADER_HEIGHT, PAGE_WIDTH, 4, 'F');

    if (logoDataUrl) {
      try {
        pdf.addImage(logoDataUrl, 'PNG', MARGIN_X, 18, 50, 50);
      } catch {
        // ignore broken image
      }
    }

    pdf.setTextColor(...PRIMARY_RGB);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    pdf.text('SeniorCare Xpress', MARGIN_X + (logoDataUrl ? 62 : 0), 38);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...MUTED_RGB);
    pdf.text('Compassionate, Professional Senior Care', MARGIN_X + (logoDataUrl ? 62 : 0), 52);

    pdf.setFontSize(9);
    pdf.setTextColor(...MUTED_RGB);
    pdf.text('513.687.7866', PAGE_WIDTH - MARGIN_X, 30, { align: 'right' });
    pdf.text('seniorcarexpress.com', PAGE_WIDTH - MARGIN_X, 42, { align: 'right' });
    pdf.text('P.O. Box 18442, Fairfield, OH 45018', PAGE_WIDTH - MARGIN_X, 54, { align: 'right' });
  };

  const drawFooter = () => {
    pdf.setDrawColor(220, 220, 225);
    pdf.line(MARGIN_X, PAGE_HEIGHT - FOOTER_HEIGHT, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - FOOTER_HEIGHT);
    pdf.setTextColor(...MUTED_RGB);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.text('SeniorCare Xpress Service Agreement', MARGIN_X, PAGE_HEIGHT - FOOTER_HEIGHT + 16);
    pdf.text(`Page ${pageNum}`, PAGE_WIDTH - MARGIN_X, PAGE_HEIGHT - FOOTER_HEIGHT + 16, { align: 'right' });
  };

  const newPage = () => {
    drawFooter();
    pdf.addPage();
    pageNum += 1;
    drawHeader();
    y = CONTENT_TOP;
  };

  const ensureSpace = (needed) => {
    if (y + needed > CONTENT_BOTTOM) newPage();
  };

  const sectionTitle = (title, number) => {
    ensureSpace(28);
    pdf.setFillColor(...PRIMARY_RGB);
    if (number) {
      pdf.circle(MARGIN_X + 7, y + 7, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(String(number), MARGIN_X + 7, y + 9.5, { align: 'center' });
    }
    pdf.setTextColor(...TEXT_RGB);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    pdf.text(title, MARGIN_X + (number ? 20 : 0), y + 11);
    y += 18;
    pdf.setDrawColor(...SECONDARY_RGB);
    pdf.setLineWidth(1.5);
    pdf.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
    pdf.setLineWidth(1);
    y += 14;
  };

  const bodyText = (text, opts = {}) => {
    const fontSize = opts.fontSize || 9.5;
    pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...(opts.muted ? MUTED_RGB : TEXT_RGB));
    const maxWidth = PAGE_WIDTH - MARGIN_X * 2;
    const lines = pdf.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      ensureSpace(fontSize + 4);
      pdf.text(line, MARGIN_X, y);
      y += fontSize + 4;
    }
    y += 4;
  };

  const fieldRow = (pairs) => {
    const colWidth = (PAGE_WIDTH - MARGIN_X * 2) / pairs.length;
    ensureSpace(34);
    pairs.forEach(([label, value], i) => {
      const x = MARGIN_X + i * colWidth;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...MUTED_RGB);
      pdf.text(label.toUpperCase(), x, y);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(...TEXT_RGB);
      const lines = pdf.splitTextToSize(value || '—', colWidth - 10);
      pdf.text(lines, x, y + 13);
    });
    y += 34;
  };

  const tableGrid = (headers, rows) => {
    const colWidth = (PAGE_WIDTH - MARGIN_X * 2) / headers.length;
    ensureSpace(20);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...MUTED_RGB);
    headers.forEach((h, i) => pdf.text(h, MARGIN_X + i * colWidth, y));
    y += 6;
    pdf.setDrawColor(220, 220, 225);
    pdf.line(MARGIN_X, y, PAGE_WIDTH - MARGIN_X, y);
    y += 12;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9.5);
    pdf.setTextColor(...TEXT_RGB);
    rows.forEach((row) => {
      ensureSpace(16);
      row.forEach((cell, i) => pdf.text(String(cell ?? '—'), MARGIN_X + i * colWidth, y));
      y += 16;
    });
    y += 6;
  };

  drawHeader();

  pdf.setTextColor(...TEXT_RGB);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('Service Agreement', MARGIN_X, y);
  y += 22;
  bodyText(
    'This agreement sets out the understanding between the Client and SeniorCare Xpress (the "Agency") about the services requested and provided.',
    { muted: true }
  );

  sectionTitle('Client Information');
  fieldRow([
    ['Effective Date', fmtDate(data.effectiveDate)],
    ['Client Name', data.clientName],
    ['Date of Birth', fmtDate(data.dob)],
  ]);
  fieldRow([
    ['SSN (last 4)', data.ssnLast4],
    ['Sex', data.sex === 'M' ? 'Male' : data.sex === 'F' ? 'Female' : '—'],
    ['Telephone', data.telephone],
  ]);
  fieldRow([
    ['Client Address', data.clientAddress],
    ['Client Email', data.clientEmail],
    ['Alternate Phone', data.alternatePhone],
  ]);
  fieldRow([
    ['Physician', data.physicianName],
    ['Physician Phone', data.physicianPhone],
    ['', ''],
  ]);

  sectionTitle('Responsible Party / Guardian');
  fieldRow([
    ['Name', data.guardianName],
    ['Relationship', data.guardianRelationship],
    ['Phone', data.guardianPhone],
  ]);
  fieldRow([
    ['Emergency Contact', data.emergencyContact],
    ['Emergency Email', data.emEmail],
    ['Emergency Phone', data.emPhone],
  ]);

  sectionTitle('Key Dates & Referral', 1);
  fieldRow([
    ['Initial Contact', fmtDate(data.initialContactDate)],
    ['Referral Date', fmtDate(data.referralDate)],
    ['Referral Source', data.referralSource],
  ]);
  fieldRow([
    ['Start of Care', fmtDate(data.startOfCareDate)],
    ['Hourly Rate', fmtMoney(data.hourlyRate)],
    ['', ''],
  ]);

  sectionTitle('Services Requested', 5);
  const serviceTypeLabels = [];
  if (data.serviceTypes?.personalCare) serviceTypeLabels.push('Personal Care');
  if (data.serviceTypes?.homemaking) serviceTypeLabels.push('Homemaking');
  if (data.serviceTypes?.companion) serviceTypeLabels.push('Companion');
  bodyText(`Service types: ${serviceTypeLabels.length ? serviceTypeLabels.join(', ') : 'None selected'}`, { bold: true });

  if (data.serviceRequests?.length) {
    tableGrid(
      ['SERVICE', 'DESCRIPTION', 'FREQUENCY'],
      data.serviceRequests.map((r) => [r.service, r.description, r.frequency])
    );
  }

  sectionTitle('Service Plan: Frequency & Duration', 6);
  if (data.serviceDescriptions?.length) {
    tableGrid(
      ['DESCRIPTION', 'FREQUENCY', 'DURATION'],
      data.serviceDescriptions.map((r) => [r.description, r.frequency, r.duration])
    );
  }

  sectionTitle('Authorization & Payment', 8);
  fieldRow([
    ['Vehicle Access', data.vehicleAccess === 'accept' ? 'Accepted' : data.vehicleAccess === 'decline' ? 'Declined' : '—'],
    ['Payment Type', data.paymentType === 'third-party' ? 'Third Party' : data.paymentType === 'private' ? 'Private Pay' : '—'],
    ['', ''],
  ]);
  if (data.paymentType === 'third-party') {
    fieldRow([
      ['Third-Party Payor', data.thirdPartyName],
      ['Insurance Claim #', data.insuranceClaimNumber],
      ['Insurance ID #', data.insuranceIdNumber],
    ]);
  }

  bodyText('Service Rates ($/hr unless noted):', { bold: true });
  tableGrid(
    ['', '≤3.0 HRS', '≥4.0 HRS', '24 HRS', 'LIVE-IN'],
    [
      ['Weekdays', fmtMoney(data.rates?.weekdayUnder3), fmtMoney(data.rates?.weekdayOver4), fmtMoney(data.rates?.weekday24), fmtMoney(data.rates?.weekdayLiveIn)],
      ['Weekends', fmtMoney(data.rates?.weekendUnder3), fmtMoney(data.rates?.weekendOver4), fmtMoney(data.rates?.weekend24), fmtMoney(data.rates?.weekendLiveIn)],
    ]
  );

  sectionTitle('Deposit', 9);
  fieldRow([
    ['Deposit Amount', fmtMoney(data.depositAmount)],
    ['Waived', data.depositWaived ? 'Yes' : 'No'],
    ['Waiver Reason', data.depositWaived ? data.depositWaivedReason : '—'],
  ]);

  sectionTitle('Signatures');
  fieldRow([
    ["Client's Signature", data.clientSignature],
    ['Date', fmtDate(data.clientSignatureDate)],
    ['', ''],
  ]);
  fieldRow([
    ["Representative's Signature", data.repSignature],
    ['Date', fmtDate(data.repSignatureDate)],
    ['Name & Relationship', data.repNameRelationship],
  ]);

  drawFooter();

  const filenameSafeName = (data.clientName || 'client').replace(/[^a-z0-9]+/gi, '_');
  pdf.save(`SeniorCareXpress_Service_Agreement_${filenameSafeName}.pdf`);
}
