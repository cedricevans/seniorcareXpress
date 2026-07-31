// The real VA PDFs have separate comb-style boxes for SSN (3/2/4 digits) and
// dollar amounts (thousands/dollars/cents). Staff type one normal value into
// a single field; these split it into the raw PDF-field values right before
// the data is saved/submitted.

export function splitSsn(ssn) {
  const digits = String(ssn ?? '').replace(/\D/g, '').slice(0, 9);
  return {
    first3: digits.slice(0, 3),
    middle2: digits.slice(3, 5),
    last4: digits.slice(5, 9),
  };
}

export function joinSsn(first3, middle2, last4) {
  const parts = [first3, middle2, last4].filter(Boolean);
  if (parts.length !== 3) return '';
  return `${first3}-${middle2}-${last4}`;
}

// Splits values[`${prefix}_ssn`] into `${prefix}_ssn_first3/middle2/last4` in
// place on a plain object, removing the combined key. No-op if the combined
// key isn't present.
export function expandSsnField(obj, prefix) {
  const key = `${prefix}_ssn`;
  if (!(key in obj)) return obj;
  const { first3, middle2, last4 } = splitSsn(obj[key]);
  obj[`${prefix}_ssn_first3`] = first3;
  obj[`${prefix}_ssn_middle2`] = middle2;
  obj[`${prefix}_ssn_last4`] = last4;
  delete obj[key];
  return obj;
}
