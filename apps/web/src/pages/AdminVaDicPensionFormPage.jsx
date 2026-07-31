import React, { useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useVaCaseProfile } from '@/hooks/useVaCaseProfile';
import VaCaseProfilePicker from '@/components/VaCaseProfilePicker';

const TEXT_FIELDS = [
  { section: "Veteran's Identification", keys: [
    ['veteran_first_name', 'First Name'], ['veteran_last_name', 'Last Name'], ['veteran_middle_initial', 'Middle Initial'],
    ['veteran_ssn_first3', 'SSN — first 3'], ['veteran_ssn_middle2', 'SSN — middle 2'], ['veteran_ssn_last4', 'SSN — last 4'],
    ['veteran_dob_month', 'DOB — Month'], ['veteran_dob_day', 'DOB — Day'], ['veteran_dob_year', 'DOB — Year'],
    ['va_file_number', 'VA File Number'], ['veteran_service_number', 'Service Number'],
    ['veteran_dod_month', 'Date of Death — Month'], ['veteran_dod_day', 'Date of Death — Day'], ['veteran_dod_year', 'Date of Death — Year'],
  ]},
  { section: 'Other Names Veteran Served Under (only if applicable)', keys: [
    ['other_name1_first', 'Name 1 — First'], ['other_name1_last', 'Name 1 — Last'], ['other_name1_mi', 'Name 1 — MI'],
    ['other_name2_first', 'Name 2 — First'], ['other_name2_last', 'Name 2 — Last'], ['other_name2_mi', 'Name 2 — MI'],
  ]},
  { section: "Claimant's Identification", keys: [
    ['claimant_first_name', 'First Name'], ['claimant_last_name', 'Last Name'], ['claimant_middle_initial', 'Middle Initial'],
    ['claimant_ssn_first3', 'SSN — first 3'], ['claimant_ssn_middle2', 'SSN — middle 2'], ['claimant_ssn_last4', 'SSN — last 4'],
    ['claimant_dob_month', 'DOB — Month'], ['claimant_dob_day', 'DOB — Day'], ['claimant_dob_year', 'DOB — Year'],
  ]},
  { section: 'Contact Information', keys: [
    ['mailing_address_street', 'Address — Street'], ['mailing_address_apt', 'Apt/Unit'], ['mailing_address_city', 'City'],
    ['mailing_address_state', 'State'], ['mailing_address_country', 'Country (2-letter)'], ['mailing_address_zip5', 'ZIP Code'],
    ['phone_area', 'Phone — Area Code'], ['phone_mid', 'Phone — Middle 3'], ['phone_last4', 'Phone — Last 4'],
    ['email', 'Email (optional)'],
  ]},
];

const CLAIMING_CHECKBOXES = [
  ['claiming_dic', 'Dependency and Indemnity Compensation (D.I.C.)'],
  ['claiming_survivors_pension', 'Survivors Pension'],
  ['claiming_accrued_benefits', 'Accrued Benefits'],
];

const RadioGroup = ({ label, value, onChange, options }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex flex-wrap gap-3 mt-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-4 py-2 rounded-md border text-sm ${value === opt.value ? 'border-primary bg-primary text-white' : 'border-slate-200'}`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  </div>
);

const AdminVaDicPensionFormPage = () => {
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [filledPdfUrl, setFilledPdfUrl] = useState(null);
  const { cases, loadingCases, importedCaseId, importCase, clearImport, autoImportCase } = useVaCaseProfile();

  const set = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleImportCase = (caseRecord) => {
    setValues((prev) => ({ ...prev, ...importCase(caseRecord) }));
  };

  useEffect(() => {
    if (autoImportCase) handleImportCase(autoImportCase);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoImportCase]);

  const handleSubmit = async () => {
    const hasFirstName = values.claimant_first_name?.trim() || values.veteran_first_name?.trim();
    const hasLastName = values.claimant_last_name?.trim() || values.veteran_last_name?.trim();
    if (!hasFirstName || !hasLastName) {
      toast.error('Claimant or Veteran First Name and Last Name are required.');
      return;
    }
    setSubmitting(true);
    setFilledPdfUrl(null);
    try {
      const forms = await pb.collection('va_forms').getList(1, 1, { filter: 'form_number = "21P-534EZ"' });
      const vaForm = forms.items[0];
      if (!vaForm) {
        toast.error('Form 21P-534EZ has not been uploaded to the library yet.');
        return;
      }

      const caseFields = ['veteran_first_name', 'veteran_last_name', 'veteran_middle_initial',
        'veteran_ssn_first3', 'veteran_ssn_middle2', 'veteran_ssn_last4', 'va_file_number', 'veteran_service_number',
        'veteran_dob_month', 'veteran_dob_day', 'veteran_dob_year',
        'claimant_first_name', 'claimant_last_name', 'claimant_middle_initial',
        'claimant_ssn_first3', 'claimant_ssn_middle2', 'claimant_ssn_last4',
        'claimant_dob_month', 'claimant_dob_day', 'claimant_dob_year',
        'mailing_address_street', 'mailing_address_apt', 'mailing_address_city',
        'mailing_address_state', 'mailing_address_country', 'mailing_address_zip5',
        'phone_area', 'phone_mid', 'phone_last4', 'email'];

      const caseData = {
        applicant_type: 'surviving_spouse',
        first_name: values.claimant_first_name || values.veteran_first_name || '',
        last_name: values.claimant_last_name || values.veteran_last_name || '',
        status: 'intake',
        ...Object.fromEntries(caseFields.map((k) => [k, values[k] || ''])),
      };
      const vaCase = importedCaseId
        ? await pb.collection('va_cases').update(importedCaseId, caseData)
        : await pb.collection('va_cases').create(caseData);

      const caseFormFields = { ...values };
      caseFields.forEach((k) => delete caseFormFields[k]);

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
        <h1 className="text-2xl font-bold">VA Form 21P-534EZ — Application for D.I.C., Survivors Pension, and/or Accrued Benefits</h1>
      </div>
      <p className="text-slate-500 mb-4">Fill in the answers below, then generate the completed PDF.</p>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3 mb-8 text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <strong>Partially available.</strong> Only Sections I-II (veteran and claimant identification, contact information, and what you're claiming)
          are filled in automatically. Sections III-XIV (service history, marital history, dependent children, D.I.C./income/expense details, direct
          deposit, and signature) are not yet automated and will stay blank on the generated PDF. The downloaded PDF is a real fillable form — those
          remaining sections must be completed manually by opening the PDF outside of this application (e.g. in Adobe Acrobat or Preview), filling in
          the blank fields, and saving the file before submission.
        </div>
      </div>

      <VaCaseProfilePicker
        cases={cases}
        loadingCases={loadingCases}
        importedCaseId={importedCaseId}
        onImport={handleImportCase}
        onClear={clearImport}
      />

      {TEXT_FIELDS.map(({ section, keys }) => (
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
        <RadioGroup label="Have you (veteran, surviving spouse, child, or parent) ever filed a claim with VA?" value={values.ever_filed_va_claim} onChange={(v) => set('ever_filed_va_claim', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
      </div>

      <div className="mb-8">
        <RadioGroup label="Did the veteran die while on active duty?" value={values.veteran_died_active_duty} onChange={(v) => set('veteran_died_active_duty', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
      </div>

      <div className="mb-8">
        <RadioGroup label="Did the veteran serve under another name?" value={values.veteran_other_name_yn} onChange={(v) => set('veteran_other_name_yn', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
      </div>

      <div className="mb-8">
        <RadioGroup label="What is your relationship to the veteran?" value={values.claimant_type} onChange={(v) => set('claimant_type', v)}
          options={[
            { value: 'surviving_spouse', label: 'Surviving Spouse' },
            { value: 'child_18_23_in_school', label: 'Child 18-23 in School' },
            { value: 'custodian_for_child_under_18', label: 'Custodian for Child Under 18' },
            { value: 'disabled_adult_child', label: 'Disabled Adult Child' },
          ]} />
      </div>

      <div className="mb-8">
        <RadioGroup label="Are you a veteran?" value={values.claimant_is_veteran} onChange={(v) => set('claimant_is_veteran', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">What Are You Claiming?</h2>
        <div className="flex flex-col gap-2">
          {CLAIMING_CHECKBOXES.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox id={key} checked={!!values[key]} onCheckedChange={(v) => set(key, !!v)} />
              <Label htmlFor={key}>{label}</Label>
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

export default AdminVaDicPensionFormPage;
