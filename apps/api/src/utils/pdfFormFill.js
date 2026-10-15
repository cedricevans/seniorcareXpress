import { PDFDocument, StandardFonts } from 'pdf-lib';

const isBlank = (v) => v === undefined || v === null || String(v).trim() === '';

// Newer VA editions collapse separate street/city/state/ZIP boxes into one
// free-text box. format 'address' builds a mailing address from parts keyed
// { street, apt, city, state, zip5, zip4, country }; otherwise parts is a list
// of value keys joined with `separator`. Field map keys for composed entries
// are just labels, since the values come from `parts`.
function composeValue(mapping, values) {
  if (mapping.format === 'address') {
    const p = Object.fromEntries(Object.entries(mapping.parts).map(([k, key]) => [k, values[key]]));
    const zip = [p.zip5, p.zip4].filter((v) => !isBlank(v)).join('-');
    const country = isBlank(p.country) || /^(us|usa|united states)$/i.test(String(p.country).trim()) ? '' : p.country;
    return [
      [p.street, isBlank(p.apt) ? '' : `Apt/Unit ${p.apt}`].filter((v) => !isBlank(v)).join(', '),
      [p.city, [p.state, zip].filter((v) => !isBlank(v)).join(' ')].filter((v) => !isBlank(v)).join(', '),
      country,
    ].filter((v) => !isBlank(v)).join('\n');
  }
  return mapping.parts.map((key) => values[key]).filter((v) => !isBlank(v)).join(mapping.separator ?? ' ');
}

export async function fillPdfForm(pdfBytes, fieldMap, values) {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  for (const [dataKey, mapping] of Object.entries(fieldMap)) {
    const value = mapping.parts ? composeValue(mapping, values) : values[dataKey];
    if (value === undefined || value === null || value === '') continue;

    if (mapping.type === 'text') {
      const field = form.getTextField(mapping.pdfField);
      let text = String(value);
      const maxLength = field.getMaxLength();
      if (maxLength !== undefined && text.length > maxLength) {
        text = text.slice(0, maxLength);
      }
      if (text.includes('\n') && !field.isMultiline()) field.enableMultiline();
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
