import React, { useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useVaCaseProfile } from '@/hooks/useVaCaseProfile';
import VaCaseProfilePicker from '@/components/VaCaseProfilePicker';
import { splitSsn, joinSsn } from '@/lib/vaFieldSplit';

const FIELDS = [
  { section: "Veteran's Identification", keys: [
    ['veteran_first_name', 'First Name'],
    ['veteran_last_name', 'Last Name'],
    ['veteran_middle_initial', 'Middle Initial'],
    ['veteran_ssn', 'SSN'],
    ['va_file_number', 'VA File Number'],
    ['veteran_dob_month', 'Date of Birth — Month'],
    ['veteran_dob_day', 'Date of Birth — Day'],
    ['veteran_dob_year', 'Date of Birth — Year'],
  ]},
  { section: "Claimant's Identification (only if claimant is NOT the veteran)", keys: [
    ['claimant_first_name', 'First Name'],
    ['claimant_last_name', 'Last Name'],
    ['claimant_middle_initial', 'Middle Initial'],
    ['claimant_ssn', 'SSN'],
    ['claimant_va_file_number', 'VA File Number (if applicable)'],
    ['claimant_dob_month', 'Date of Birth — Month'],
    ['claimant_dob_day', 'Date of Birth — Day'],
    ['claimant_dob_year', 'Date of Birth — Year'],
  ]},
  { section: 'Nursing Home Information', keys: [
    ['nursing_home_name', 'Name of Nursing Home'],
    ['nursing_home_address_street', 'Address — Number and Street'],
    ['nursing_home_address_apt', 'Apt/Unit Number'],
    ['nursing_home_address_city', 'City'],
    ['nursing_home_address_state', 'State/Province'],
    ['nursing_home_address_country', 'Country (2-letter code)'],
    ['nursing_home_address_zip5', 'ZIP Code'],
    ['nursing_home_address_zip4', 'ZIP+4'],
    ['date_admitted_month', 'Date Admitted — Month'],
    ['date_admitted_day', 'Date Admitted — Day'],
    ['date_admitted_year', 'Date Admitted — Year'],
  ]},
  { section: 'Medicaid & Care', keys: [
    ['monthly_amount', 'Monthly Amount Patient Responsible For ($)'],
    ['nursing_home_official_name', "Nursing Home Official's Name"],
    ['nursing_home_official_title', "Nursing Home Official's Title"],
    ['nursing_home_official_phone_area', 'Official Phone — Area Code'],
    ['nursing_home_official_phone_mid', 'Official Phone — Middle 3'],
    ['nursing_home_official_phone_last4', 'Official Phone — Last 4'],
  ]},
];

const RADIO_FIELDS = [
  { key: 'is_medicaid_approved_facility', label: 'Is the nursing home a Medicaid approved facility?', options: ['yes', 'no'] },
  { key: 'patient_applied_for_medicaid', label: 'Has the patient applied for Medicaid?', options: ['yes', 'no'] },
  { key: 'patient_covered_by_medicaid', label: 'Is the patient covered by Medicaid?', options: ['yes', 'no'] },
  { key: 'care_type', label: 'Type of care', options: ['skilled', 'intermediate'] },
];

const AdminVaNursingHomeFormPage = () => {
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [filledPdfUrl, setFilledPdfUrl] = useState(null);
  const { cases, loadingCases, importedCaseId, importCase, clearImport, autoImportCase } = useVaCaseProfile();

  const set = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleImportCase = (caseRecord) => {
    const imported = importCase(caseRecord);
    imported.veteran_ssn = joinSsn(caseRecord.veteran_ssn_first3, caseRecord.veteran_ssn_middle2, caseRecord.veteran_ssn_last4);
    imported.claimant_ssn = joinSsn(caseRecord.claimant_ssn_first3, caseRecord.claimant_ssn_middle2, caseRecord.claimant_ssn_last4);
    setValues((prev) => ({ ...prev, ...imported }));
  };

  useEffect(() => {
    if (autoImportCase) handleImportCase(autoImportCase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoImportCase]);

  const handleSubmit = async () => {
    if (!values.veteran_first_name?.trim() || !values.veteran_last_name?.trim()) {
      toast.error('Veteran First Name and Last Name are required.');
      return;
    }
    setSubmitting(true);
    setFilledPdfUrl(null);
    try {
      const forms = await pb.collection('va_forms').getList(1, 1, { filter: 'form_number = "21-0779"' });
      const vaForm = forms.items[0];
      if (!vaForm) {
        toast.error('Form 21-0779 has not been uploaded to the library yet.');
        return;
      }

      const veteranSsn = splitSsn(values.veteran_ssn);
      const claimantSsn = splitSsn(values.claimant_ssn);

      const caseFields = ['veteran_first_name', 'veteran_last_name', 'veteran_middle_initial',
        'veteran_ssn_first3', 'veteran_ssn_middle2', 'veteran_ssn_last4', 'va_file_number',
        'veteran_dob_month', 'veteran_dob_day', 'veteran_dob_year',
        'claimant_first_name', 'claimant_last_name', 'claimant_middle_initial',
        'claimant_ssn_first3', 'claimant_ssn_middle2', 'claimant_ssn_last4',
        'claimant_va_file_number', 'claimant_dob_month', 'claimant_dob_day', 'claimant_dob_year'];

      const valuesWithSsnParts = {
        ...values,
        veteran_ssn_first3: veteranSsn.first3, veteran_ssn_middle2: veteranSsn.middle2, veteran_ssn_last4: veteranSsn.last4,
        claimant_ssn_first3: claimantSsn.first3, claimant_ssn_middle2: claimantSsn.middle2, claimant_ssn_last4: claimantSsn.last4,
      };

      const caseData = {
        applicant_type: 'veteran',
        first_name: values.veteran_first_name || '',
        last_name: values.veteran_last_name || '',
        status: 'intake',
        ...Object.fromEntries(caseFields.map((k) => [k, valuesWithSsnParts[k] || ''])),
      };
      const vaCase = importedCaseId
        ? await pb.collection('va_cases').update(importedCaseId, caseData)
        : await pb.collection('va_cases').create(caseData);

      const caseFormFields = { ...valuesWithSsnParts };
      delete caseFormFields.veteran_ssn;
      delete caseFormFields.claimant_ssn;
      caseFields.forEach((k) => delete caseFormFields[k]);

      // The real PDF has separate comb-style dollars/cents boxes; split the
      // single "Monthly Amount" field the user typed right before submitting.
      if ('monthly_amount' in caseFormFields) {
        const raw = String(caseFormFields.monthly_amount || '').replace(/[^0-9.]/g, '');
        const [dollars = '', centsPart = ''] = raw.split('.');
        caseFormFields.monthly_amount_dollars = dollars;
        caseFormFields.monthly_amount_cents = centsPart.padEnd(2, '0').slice(0, 2);
        delete caseFormFields.monthly_amount;
      }

      const caseForm = await pb.collection('va_case_forms').create({
        case_id: vaCase.id,
        form_id: vaForm.id,
        status: 'blank',
        ...caseFormFields,
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
        <h1 className="text-2xl font-bold">VA Form 21-0779 — Nursing Home Information</h1>
      </div>
      <p className="text-slate-500 mb-8">Fill in the answers below, then generate the completed PDF.</p>

      <VaCaseProfilePicker
        cases={cases}
        loadingCases={loadingCases}
        importedCaseId={importedCaseId}
        onImport={handleImportCase}
        onClear={clearImport}
        importNote="Note: this form only asks for identification info, so importing a profile only fills name/SSN/DOB/VA file number — it does not have address, phone, or email fields to import."
      />

      {FIELDS.map(({ section, keys }) => (
        <div key={section} className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{section}</h2>
          <div className="grid grid-cols-2 gap-4">
            {keys.map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Input id={key} value={values[key] || ''} onChange={(e) => set(key, e.target.value)} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Medicaid Status</h2>
        <div className="grid grid-cols-2 gap-4">
          {RADIO_FIELDS.map(({ key, label, options }) => (
            <div key={key}>
              <Label>{label}</Label>
              <div className="flex gap-3 mt-1">
                {options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => set(key, opt)}
                    className={`px-4 py-2 rounded-md border text-sm capitalize ${
                      values[key] === opt ? 'border-primary bg-primary text-white' : 'border-slate-200'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

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

export default AdminVaNursingHomeFormPage;
