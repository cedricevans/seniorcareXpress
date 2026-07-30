import React, { useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, FileText, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

const TEXT_FIELDS = [
  { section: "Veteran's Identification", keys: [
    ['veteran_first_name', 'First Name'], ['veteran_last_name', 'Last Name'], ['veteran_middle_initial', 'Middle Initial'],
    ['veteran_ssn_first3', 'SSN — first 3'], ['veteran_ssn_middle2', 'SSN — middle 2'], ['veteran_ssn_last4', 'SSN — last 4'],
    ['veteran_dob_month', 'DOB — Month'], ['veteran_dob_day', 'DOB — Day'], ['veteran_dob_year', 'DOB — Year'],
    ['va_file_number', 'VA File Number'], ['veteran_service_number', 'Service Number'],
  ]},
  { section: 'Contact Information', keys: [
    ['mailing_address_street', 'Address — Street'], ['mailing_address_apt', 'Apt/Unit'], ['mailing_address_city', 'City'],
    ['mailing_address_state', 'State'], ['mailing_address_country', 'Country (2-letter)'], ['mailing_address_zip5', 'ZIP Code'],
    ['phone_area', 'Phone — Area Code'], ['phone_mid', 'Phone — Middle 3'], ['phone_last4', 'Phone — Last 4'],
  ]},
  { section: 'Service Information', keys: [
    ['other_name_served_under_first', 'Other Name Served Under — First'], ['other_name_served_under_last', 'Other Name Served Under — Last'],
    ['date_entered_active_duty_month', 'Entered Active Duty — Month'], ['date_entered_active_duty_day', 'Entered Active Duty — Day'], ['date_entered_active_duty_year', 'Entered Active Duty — Year'],
    ['date_release_active_duty_month', 'Release From Active Duty — Month'], ['date_release_active_duty_day', 'Release From Active Duty — Day'], ['date_release_active_duty_year', 'Release From Active Duty — Year'],
    ['place_last_separation_line1', 'Place of Last Separation — Line 1'], ['place_last_separation_line2', 'Place of Last Separation — Line 2'],
  ]},
  { section: 'Employment', keys: [
    ['current_work_kind', 'Current Work (if employed)'], ['current_work_hours_per_week', 'Current Hours/Week'],
    ['date_last_worked_month', 'Last Worked — Month'], ['date_last_worked_day', 'Last Worked — Day'], ['date_last_worked_year', 'Last Worked — Year'],
    ['last_work_hours_per_week', 'Last Job Hours/Week'], ['last_job_title', 'Last Job Title'], ['last_work_kind', 'Last Kind of Work'],
  ]},
  { section: 'Spouse Information (Section VI)', keys: [
    ['spouse_first_name', 'Spouse First Name'], ['spouse_last_name', 'Spouse Last Name'], ['spouse_middle_initial', 'Spouse Middle Initial'],
    ['spouse_dob_month', 'Spouse DOB — Month'], ['spouse_dob_day', 'Spouse DOB — Day'], ['spouse_dob_year', 'Spouse DOB — Year'],
    ['spouse_ssn_first3', 'Spouse SSN — first 3'], ['spouse_ssn_middle2', 'Spouse SSN — middle 2'], ['spouse_ssn_last4', 'Spouse SSN — last 4'],
    ['date_of_marriage_month', 'Marriage Date — Month'], ['date_of_marriage_day', 'Marriage Date — Day'], ['date_of_marriage_year', 'Marriage Date — Year'],
    ['place_of_marriage', 'Place of Marriage'], ['spouse_va_file_number', "Spouse's VA File Number"],
  ]},
  { section: 'Dependent Children — Child 1 (Section VIII)', keys: [
    ['num_dependent_children', 'How Many Dependent Children Live With You'],
    ['child1_first_name', 'First Name'], ['child1_last_name', 'Last Name'], ['child1_middle_initial', 'Middle Initial'],
    ['child1_ssn_first3', 'SSN — first 3'], ['child1_ssn_middle2', 'SSN — middle 2'], ['child1_ssn_last4', 'SSN — last 4'],
    ['child1_dob_month', 'DOB — Month'], ['child1_dob_day', 'DOB — Day'], ['child1_dob_year', 'DOB — Year'],
    ['child1_place_of_birth', 'Place of Birth'],
  ]},
  { section: 'Income & Assets (Section IX summary)', keys: [
    ['total_assets_amount', 'Total Value of Assets ($)'],
  ]},
];

const RADIO_YN = [
  ['is_prisoner_of_war', 'Ever a Prisoner of War?'],
  ['ever_filed_va_claim', 'Have you ever filed a claim with VA?'],
  ['currently_employed', 'Are you currently employed?'],
  ['has_over_75k_assets', 'Over $75,000 in assets?'],
  ['transferred_assets_3yr', 'Transferred assets in the last 3 years?'],
  ['owns_primary_residence', 'Own your primary residence?'],
  ['lot_over_2_acres', 'Lot over 2 acres?'],
];

const BRANCHES = [
  ['branch_army', 'Army'], ['branch_navy', 'Navy'], ['branch_air_force', 'Air Force'],
  ['branch_marine_corps', 'Marine Corps'], ['branch_coast_guard', 'Coast Guard'],
  ['branch_space_force', 'Space Force'], ['branch_noaa', 'NOAA'], ['branch_usphs', 'USPHS'],
];

const CHILD1_STATUS = [
  ['child1_status_biological', 'Biological'], ['child1_status_stepchild', 'Stepchild'],
  ['child1_status_adopted', 'Adopted'], ['child1_status_seriously_disabled', 'Seriously Disabled'],
  ['child1_status_18_to_23_in_school', '18-23 (in school)'], ['child1_status_previously_married', 'Previously Married'],
];

const RadioGroup = ({ label, value, onChange, options }) => (
  <div>
    <Label>{label}</Label>
    <div className="flex gap-3 mt-1">
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

const AdminVaPensionApplicationFormPage = () => {
  const [values, setValues] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [filledPdfUrl, setFilledPdfUrl] = useState(null);

  const set = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async () => {
    setSubmitting(true);
    setFilledPdfUrl(null);
    try {
      const forms = await pb.collection('va_forms').getList(1, 1, { filter: 'form_number = "21P-527EZ"' });
      const vaForm = forms.items[0];
      if (!vaForm) {
        toast.error('Form 21P-527EZ has not been uploaded to the library yet.');
        return;
      }

      const caseFields = ['veteran_first_name', 'veteran_last_name', 'veteran_middle_initial',
        'veteran_ssn_first3', 'veteran_ssn_middle2', 'veteran_ssn_last4', 'va_file_number', 'veteran_service_number',
        'veteran_dob_month', 'veteran_dob_day', 'veteran_dob_year'];

      const vaCase = await pb.collection('va_cases').create({
        applicant_type: 'veteran',
        first_name: values.veteran_first_name || '',
        last_name: values.veteran_last_name || '',
        status: 'intake',
        ...Object.fromEntries(caseFields.map((k) => [k, values[k] || ''])),
      });

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
        <h1 className="text-2xl font-bold">VA Form 21P-527EZ — Application for Veterans Pension</h1>
      </div>
      <p className="text-slate-500 mb-4">Fill in the answers below, then generate the completed PDF.</p>

      <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-md p-3 mb-8 text-sm text-amber-800">
        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
        <div>
          <strong>Partially available.</strong> Sections I-IX (identity, service, employment, marital status, one dependent child, income/asset summary)
          are filled in automatically. Detailed income breakdown (9H-9K), medical/in-home care expenses (Section X), direct deposit, and signature
          (Sections XI-XIV) are not yet automated and will stay blank on the generated PDF. The downloaded PDF is a real fillable form — those
          remaining sections can be completed manually by opening the PDF outside of this application (e.g. in Adobe Acrobat or Preview) and typing
          directly into the blank fields, the same as filling out any PDF form by hand.
        </div>
      </div>

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
        <h2 className="text-lg font-semibold mb-4">Branch of Service</h2>
        <div className="grid grid-cols-4 gap-3">
          {BRANCHES.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox id={key} checked={!!values[key]} onCheckedChange={(v) => set(key, !!v)} />
              <Label htmlFor={key}>{label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-6">
        {RADIO_YN.map(([key, label]) => (
          <RadioGroup key={key} label={label} value={values[key]} onChange={(v) => set(key, v)}
            options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
        ))}
      </div>

      <div className="mb-8">
        <RadioGroup label="Marital Status" value={values.marital_status} onChange={(v) => set('marital_status', v)}
          options={[{ value: 'married', label: 'Married' }, { value: 'separated', label: 'Separated' }, { value: 'not_married', label: 'Not Married' }]} />
      </div>

      <div className="mb-8">
        <RadioGroup label="Type of Marriage" value={values.marriage_type} onChange={(v) => set('marriage_type', v)}
          options={[{ value: 'ceremonial', label: 'Ceremonial' }, { value: 'other', label: 'Other' }]} />
      </div>

      <div className="mb-8">
        <RadioGroup label="Is Spouse Also a Veteran?" value={values.spouse_is_veteran} onChange={(v) => set('spouse_is_veteran', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Child 1 — Status</h2>
        <div className="grid grid-cols-3 gap-3">
          {CHILD1_STATUS.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox id={key} checked={!!values[key]} onCheckedChange={(v) => set(key, !!v)} />
              <Label htmlFor={key}>{label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <RadioGroup label="How Many Income Sources Does Your Family Have?" value={values.income_sources_count} onChange={(v) => set('income_sources_count', v)}
          options={[{ value: 'none', label: 'No Income' }, { value: 'one_to_four', label: '1-4 Sources' }, { value: 'five_plus', label: '5+ Sources' }]} />
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

export default AdminVaPensionApplicationFormPage;
