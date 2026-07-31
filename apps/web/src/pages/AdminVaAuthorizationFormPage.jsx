import React, { useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useVaCaseProfile } from '@/hooks/useVaCaseProfile';
import VaCaseProfilePicker from '@/components/VaCaseProfilePicker';

const FIELDS = [
  { section: "Veteran's Identification", keys: [
    ['veteran_first_name', 'First Name'],
    ['veteran_last_name', 'Last Name'],
    ['veteran_middle_initial', 'Middle Initial'],
    ['veteran_ssn_first3', 'SSN — first 3'],
    ['veteran_ssn_middle2', 'SSN — middle 2'],
    ['veteran_ssn_last4', 'SSN — last 4'],
    ['va_file_number', 'VA File Number (if known)'],
    ['veteran_dob_month', 'Date of Birth — Month'],
    ['veteran_dob_day', 'Date of Birth — Day'],
    ['veteran_dob_year', 'Date of Birth — Year'],
    ['veteran_service_number', 'Service Number (if applicable)'],
  ]},
  { section: 'Beneficiary/Claimant (only if NOT the veteran)', keys: [
    ['beneficiary_first_name', 'First Name'],
    ['beneficiary_last_name', 'Last Name'],
    ['beneficiary_middle_initial', 'Middle Initial'],
    ['beneficiary_address_street', 'Address — Street'],
    ['beneficiary_address_apt', 'Apt/Unit'],
    ['beneficiary_address_city', 'City'],
    ['beneficiary_address_state', 'State'],
    ['beneficiary_address_country', 'Country (2-letter)'],
    ['beneficiary_address_zip5', 'ZIP Code'],
    ['beneficiary_phone_area', 'Phone — Area Code'],
    ['beneficiary_phone_mid', 'Phone — Middle 3'],
    ['beneficiary_phone_last4', 'Phone — Last 4'],
    ['beneficiary_email', 'Email (optional)'],
  ]},
  { section: 'Recipient — Person (Item 10A/10B)', keys: [
    ['recipient_person_first_name', 'First Name'],
    ['recipient_person_last_name', 'Last Name'],
    ['recipient_person_middle_initial', 'Middle Initial'],
    ['recipient_person_address_street', 'Address — Street'],
    ['recipient_person_address_city', 'City'],
    ['recipient_person_address_state', 'State'],
    ['recipient_person_address_country', 'Country (2-letter)'],
    ['recipient_person_address_zip5', 'ZIP Code'],
  ]},
  { section: 'Recipient — Organization (Item 10C/10D, use instead of Person)', keys: [
    ['recipient_org_name_line1', 'Organization Name (line 1)'],
    ['recipient_org_address_street', 'Address — Street'],
    ['recipient_org_address_city', 'City'],
    ['recipient_org_address_state', 'State'],
    ['recipient_org_address_country', 'Country (2-letter)'],
    ['recipient_org_address_zip5', 'ZIP Code'],
  ]},
  { section: 'Security Question (Item 14, pick one)', keys: [
    ['security_answer_first_pet', "Answer — Your first pet's name"],
  ]},
  { section: 'Signature', keys: [
    ['date_signed_month', 'Date Signed — Month'],
    ['date_signed_day', 'Date Signed — Day'],
    ['date_signed_year', 'Date Signed — Year'],
  ]},
];

const DISCLOSURE_SCOPE_OPTIONS = ['limited', 'any'];
const DURATION_OPTIONS = ['one_time', 'ongoing', 'until_date'];

const AdminVaAuthorizationFormPage = () => {
  const [values, setValues] = useState({ security_question_first_pet: true });
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
    if (!values.veteran_first_name?.trim() || !values.veteran_last_name?.trim()) {
      toast.error('Veteran First Name and Last Name are required.');
      return;
    }
    setSubmitting(true);
    setFilledPdfUrl(null);
    try {
      const forms = await pb.collection('va_forms').getList(1, 1, { filter: 'form_number = "21-0845"' });
      const vaForm = forms.items[0];
      if (!vaForm) {
        toast.error('Form 21-0845 has not been uploaded to the library yet.');
        return;
      }

      const caseFields = ['veteran_first_name', 'veteran_last_name', 'veteran_middle_initial',
        'veteran_ssn_first3', 'veteran_ssn_middle2', 'veteran_ssn_last4', 'va_file_number',
        'veteran_dob_month', 'veteran_dob_day', 'veteran_dob_year', 'veteran_service_number'];

      const caseData = {
        applicant_type: 'veteran',
        first_name: values.veteran_first_name || '',
        last_name: values.veteran_last_name || '',
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
        <h1 className="text-2xl font-bold">VA Form 21-0845 — Authorization to Disclose Personal Information</h1>
      </div>
      <p className="text-slate-500 mb-8">Fill in the answers below, then generate the completed PDF.</p>

      <VaCaseProfilePicker
        cases={cases}
        loadingCases={loadingCases}
        importedCaseId={importedCaseId}
        onImport={handleImportCase}
        onClear={clearImport}
        importNote="Note: importing a profile fills the veteran's identification info only. The Beneficiary/Claimant contact fields below (address, phone, email) belong to the person receiving the disclosure, not the veteran, so they always need to be entered manually."
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
        <h2 className="text-lg font-semibold mb-4">Item 11 — Scope of Disclosure</h2>
        <div className="flex gap-3">
          {DISCLOSURE_SCOPE_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => set('disclosure_scope', opt)}
              className={`px-4 py-2 rounded-md border text-sm capitalize ${
                values.disclosure_scope === opt ? 'border-primary bg-primary text-white' : 'border-slate-200'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {values.disclosure_scope === 'any' && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">Item 13 — Duration</h2>
          <div className="flex gap-3">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => set('any_info_duration', opt)}
                className={`px-4 py-2 rounded-md border text-sm capitalize ${
                  values.any_info_duration === opt ? 'border-primary bg-primary text-white' : 'border-slate-200'
                }`}
              >
                {opt.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-8 flex items-center gap-2">
        <Checkbox
          id="beneficiary_agrees_to_email"
          checked={!!values.beneficiary_agrees_to_email}
          onCheckedChange={(v) => set('beneficiary_agrees_to_email', !!v)}
        />
        <Label htmlFor="beneficiary_agrees_to_email">I agree to receive electronic correspondence from VA</Label>
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

export default AdminVaAuthorizationFormPage;
