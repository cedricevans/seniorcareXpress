import { PDFDocument, StandardFonts } from 'pdf-lib';

export async function fillPdfForm(pdfBytes, fieldMap, values) {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const [dataKey, mapping] of Object.entries(fieldMap)) {
    const value = values[dataKey];
    if (value === undefined || value === null || value === '') continue;

    if (mapping.type === 'text') {
      const field = form.getTextField(mapping.pdfField);
      let text = String(value);
      const maxLength = field.getMaxLength();
      if (maxLength !== undefined && text.length > maxLength) {
        text = text.slice(0, maxLength);
      }
      field.setText(text);
    } else if (mapping.type === 'checkbox') {
      const checkbox = form.getCheckBox(mapping.pdfField);
      if (value) checkbox.check(); else checkbox.uncheck();
    } else if (mapping.type === 'radio') {
      const exportValue = mapping.values?.[value];
      if (exportValue !== undefined) {
        form.getRadioGroup(mapping.pdfField).select(exportValue);
      }
    }
  }

  // Comb-style text fields (per-character boxes, common on VA forms) need an
  // explicitly embedded font here or their appearance streams can render blank
  // in some viewers even though the underlying field value is set correctly.
  form.updateFieldAppearances(font);

  return pdfDoc.save();
}
