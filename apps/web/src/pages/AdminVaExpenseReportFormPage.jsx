import React, { useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

// Main-form slots come first (main_a, main_b, ...), overflow rows map to the
// numbered addendum slots (addendum_a_row1, addendum_a_row2, ...) once the
// main form's fixed slots are used up — matches how the real PDF works.
const SECTIONS = {
  in_home: { label: 'In-Home Care / Care Facility Expenses', mainSlots: ['a', 'b'], addendumPrefix: 'addendum_a_row', addendumMax: 6 },
  other: { label: 'Other Medical Expenses', mainSlots: ['a', 'b', 'c', 'd', 'e', 'f', 'g'], addendumPrefix: 'addendum_b_row', addendumMax: 7 },
  mileage: { label: 'Mileage', mainSlots: ['a', 'b', 'c', 'd'], addendumPrefix: 'addendum_c_row', addendumMax: 8 },
};

function slotFieldPrefix(sectionKey, slotIndex) {
  const section = SECTIONS[sectionKey];
  if (slotIndex < section.mainSlots.length) {
    const letter = section.mainSlots[slotIndex];
    return sectionKey === 'in_home' ? `in_home_${letter}` : sectionKey === 'other' ? `other_${letter}` : `mileage_${letter}`;
  }
  const addendumIndex = slotIndex - section.mainSlots.length + 1;
  return `${section.addendumPrefix}${addendumIndex}`;
}

const IN_HOME_FIELDS = [
  ['provider_name', 'Provider Name'],
  ['start_month', 'Start — Month'], ['start_day', 'Start — Day'], ['start_year', 'Start — Year'],
  ['end_month', 'End — Month'], ['end_day', 'End — Day'], ['end_year', 'End — Year'],
  ['amount_thousands', 'Amount — Thousands'], ['amount_dollars', 'Amount — Dollars'], ['amount_cents', 'Amount — Cents'],
  ['rate_per_hour', 'Rate (per hour, if in-home)'], ['hours_per_week', 'Hours/Week (if in-home)'],
];
const OTHER_FIELDS = [
  ['date_month', 'Date Paid — Month'], ['date_day', 'Date Paid — Day'], ['date_year', 'Date Paid — Year'],
  ['amount_thousands', 'Amount — Thousands'], ['amount_dollars', 'Amount — Dollars'], ['amount_cents', 'Amount — Cents'],
  ['paid_to', 'Paid To'], ['purpose', 'Purpose'],
];
const MILEAGE_FIELDS = [
  ['location', 'Location Traveled To'], ['total_miles', 'Total Miles'],
  ['date_month', 'Date — Month'], ['date_day', 'Date — Day'], ['date_year', 'Date — Year'],
  ['amount_reimbursed', 'Amount Reimbursed ($)'], ['amount_cents', 'Cents'],
];

const WHOSE_OPTIONS = { in_home: ['veteran', 'spouse', 'child', 'other'], other: ['veteran', 'spouse', 'child', 'other'], mileage: ['veteran', 'spouse', 'child'] };
const FREQ_OPTIONS = ['monthly', 'annually', 'not_recurring'];

const ExpenseRow = ({ sectionKey, slotIndex, data, onChange, onRemove }) => {
  const section = SECTIONS[sectionKey];
  const fields = sectionKey === 'in_home' ? IN_HOME_FIELDS : sectionKey === 'other' ? OTHER_FIELDS : MILEAGE_FIELDS;
  const set = (key, val) => onChange({ ...data, [key]: val });

  return (
    <div className="border rounded-md p-4 mb-3 relative">
      <button type="button" onClick={onRemove} className="absolute top-3 right-3 text-slate-400 hover:text-red-500">
        <Trash2 className="w-4 h-4" />
      </button>
      <div className="mb-3">
        <Label>Whose expense?</Label>
        <div className="flex gap-2 mt-1">
          {WHOSE_OPTIONS[sectionKey].map((opt) => (
            <button key={opt} type="button" onClick={() => set('whose', opt)}
              className={`px-3 py-1.5 rounded-md border text-sm capitalize ${data.whose === opt ? 'border-primary bg-primary text-white' : 'border-slate-200'}`}>
              {opt}
            </button>
          ))}
        </div>
        {data.whose === 'child' && (
          <Input className="mt-2" placeholder="Child's name" value={data.child_name || ''} onChange={(e) => set('child_name', e.target.value)} />
        )}
      </div>
      {sectionKey === 'other' && (
        <div className="mb-3">
          <Label>Frequency</Label>
          <div className="flex gap-2 mt-1">
            {FREQ_OPTIONS.map((opt) => (
              <button key={opt} type="button" onClick={() => set('frequency', opt)}
                className={`px-3 py-1.5 rounded-md border text-sm capitalize ${data.frequency === opt ? 'border-primary bg-primary text-white' : 'border-slate-200'}`}>
                {opt.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="grid grid-cols-3 gap-3">
        {fields.map(([key, label]) => (
          <div key={key}>
            <Label className="text-xs">{label}</Label>
            <Input value={data[key] || ''} onChange={(e) => set(key, e.target.value)} />
          </div>
        ))}
      </div>
    </div>
  );
};

const AdminVaExpenseReportFormPage = () => {
  const [identity, setIdentity] = useState({});
  const [rows, setRows] = useState({ in_home: [], other: [], mileage: [] });
  const [submitting, setSubmitting] = useState(false);
  const [filledPdfUrl, setFilledPdfUrl] = useState(null);

  const setId = (key, val) => setIdentity((prev) => ({ ...prev, [key]: val }));

  const addRow = (sectionKey) => {
    const section = SECTIONS[sectionKey];
    const max = section.mainSlots.length + section.addendumMax;
    setRows((prev) => {
      if (prev[sectionKey].length >= max) {
        toast.error(`Maximum ${max} expenses reached for this section (main form + addendum capacity)`);
        return prev;
      }
      return { ...prev, [sectionKey]: [...prev[sectionKey], {}] };
    });
  };
  const removeRow = (sectionKey, idx) => {
    setRows((prev) => ({ ...prev, [sectionKey]: prev[sectionKey].filter((_, i) => i !== idx) }));
  };
  const updateRow = (sectionKey, idx, data) => {
    setRows((prev) => ({ ...prev, [sectionKey]: prev[sectionKey].map((r, i) => (i === idx ? data : r)) }));
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setFilledPdfUrl(null);
    try {
      const forms = await pb.collection('va_forms').getList(1, 1, { filter: 'form_number = "21P-8416"' });
      const vaForm = forms.items[0];
      if (!vaForm) {
        toast.error('Form 21P-8416 has not been uploaded to the library yet.');
        return;
      }

      const vaCase = await pb.collection('va_cases').create({
        applicant_type: 'veteran',
        first_name: identity.veteran_first_name || '',
        last_name: identity.veteran_last_name || '',
        status: 'intake',
        veteran_first_name: identity.veteran_first_name || '',
        veteran_last_name: identity.veteran_last_name || '',
      });

      const expenseReportData = {};
      Object.entries(rows).forEach(([sectionKey, sectionRows]) => {
        sectionRows.forEach((rowData, idx) => {
          const prefix = slotFieldPrefix(sectionKey, idx);
          Object.entries(rowData).forEach(([key, value]) => {
            expenseReportData[`${prefix}_${key}`] = value;
          });
        });
      });

      const caseForm = await pb.collection('va_case_forms').create({
        case_id: vaCase.id,
        form_id: vaForm.id,
        status: 'blank',
        veteran_first_name: identity.veteran_first_name || '',
        veteran_middle_initial: identity.veteran_middle_initial || '',
        veteran_last_name: identity.veteran_last_name || '',
        veteran_ssn: identity.veteran_ssn || '',
        va_file_number: identity.va_file_number || '',
        mailing_address_street: identity.mailing_address_street || '',
        mailing_address_city: identity.mailing_address_city || '',
        mailing_address_state: identity.mailing_address_state || '',
        mailing_address_country: identity.mailing_address_country || '',
        mailing_address_zip: identity.mailing_address_zip || '',
        phone_area: identity.phone_area || '',
        phone_mid: identity.phone_mid || '',
        phone_last4: identity.phone_last4 || '',
        report_date_from: identity.report_date_from || '',
        report_date_to: identity.report_date_to || '',
        date_signed_month: identity.date_signed_month || '',
        date_signed_day: identity.date_signed_day || '',
        date_signed_year: identity.date_signed_year || '',
        expense_report_data: expenseReportData,
      });

      const res = await apiServerClient.fetch(`/va-forms/${caseForm.id}/fill`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to fill form');
        return;
      }
      const updated = await res.json();
      setFilledPdfUrl(pb.files.getURL(updated, updated.filled_pdf));
      toast.success('Form filled successfully');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong filling the form');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">VA Form 21P-8416 — Medical Expense Report</h1>
      </div>
      <p className="text-slate-500 mb-8">Add each medical expense as a row. Extra rows automatically use the form's addendum pages.</p>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Veteran & Claimant Identification</h2>
        <div className="grid grid-cols-2 gap-4">
          {[
            ['veteran_first_name', 'First Name'], ['veteran_middle_initial', 'Middle Initial'], ['veteran_last_name', 'Last Name'],
            ['veteran_ssn', 'SSN (9 digits)'], ['va_file_number', 'VA File Number'],
            ['mailing_address_street', 'Address — Street'], ['mailing_address_city', 'City'],
            ['mailing_address_state', 'State'], ['mailing_address_country', 'Country'], ['mailing_address_zip', 'ZIP Code'],
            ['phone_area', 'Phone — Area Code'], ['phone_mid', 'Phone — Middle 3'], ['phone_last4', 'Phone — Last 4'],
            ['report_date_from', 'Reporting Period — From (MM/DD/YYYY)'], ['report_date_to', 'Reporting Period — To (MM/DD/YYYY)'],
            ['date_signed_month', 'Date Signed — Month'], ['date_signed_day', 'Date Signed — Day'], ['date_signed_year', 'Date Signed — Year'],
          ].map(([key, label]) => (
            <div key={key}>
              <Label htmlFor={key}>{label}</Label>
              <Input id={key} value={identity[key] || ''} onChange={(e) => setId(key, e.target.value)} />
            </div>
          ))}
        </div>
      </div>

      {Object.entries(SECTIONS).map(([sectionKey, section]) => (
        <div key={sectionKey} className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">{section.label}</h2>
            <Button variant="outline" size="sm" onClick={() => addRow(sectionKey)}>
              <Plus className="w-4 h-4 mr-1" /> Add Expense
            </Button>
          </div>
          {rows[sectionKey].length === 0 && <p className="text-slate-400 text-sm">No expenses added.</p>}
          {rows[sectionKey].map((rowData, idx) => (
            <ExpenseRow
              key={idx}
              sectionKey={sectionKey}
              slotIndex={idx}
              data={rowData}
              onChange={(data) => updateRow(sectionKey, idx, data)}
              onRemove={() => removeRow(sectionKey, idx)}
            />
          ))}
        </div>
      ))}

      <Button onClick={handleSubmit} disabled={submitting}>
        {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Filling PDF...</> : 'Generate Filled PDF'}
      </Button>

      {filledPdfUrl && (
        <a href={filledPdfUrl} target="_blank" rel="noreferrer" className="ml-4 inline-flex items-center text-primary font-medium">
          <Download className="w-4 h-4 mr-1" /> Download Filled Form
        </a>
      )}
    </div>
  );
};

export default AdminVaExpenseReportFormPage;
