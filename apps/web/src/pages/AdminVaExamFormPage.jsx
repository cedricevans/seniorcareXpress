import React, { useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useVaCaseProfile } from '@/hooks/useVaCaseProfile';
import VaCaseProfilePicker from '@/components/VaCaseProfilePicker';

const TEXT_FIELDS = [
  { section: "Veteran's Identification", keys: [
    ['veteran_first_name', 'First Name'], ['veteran_last_name', 'Last Name'], ['veteran_middle_initial', 'Middle Initial'],
    ['veteran_ssn_first3', 'SSN — first 3'], ['veteran_ssn_middle2', 'SSN — middle 2'], ['veteran_ssn_last4', 'SSN — last 4'],
    ['va_file_number', 'VA File Number'], ['veteran_service_number', 'Service Number'],
    ['veteran_dob_month', 'DOB — Month'], ['veteran_dob_day', 'DOB — Day'], ['veteran_dob_year', 'DOB — Year'],
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
  { section: 'Hospitalization (Section IV)', keys: [
    ['hospital_date_admitted_month', 'Date Admitted — Month'], ['hospital_date_admitted_day', 'Date Admitted — Day'], ['hospital_date_admitted_year', 'Date Admitted — Year'],
    ['hospital_name', 'Name of Hospital'], ['hospital_address', 'Address of Hospital'],
  ]},
  { section: 'Certification (Section V)', keys: [
    ['veteran_date_signed_month', 'Date Signed — Month'], ['veteran_date_signed_day', 'Date Signed — Day'], ['veteran_date_signed_year', 'Date Signed — Year'],
  ]},
  { section: 'Examination Information (Section VI — Examiner)', keys: [
    ['exam_date_month', 'Exam Date — Month'], ['exam_date_day', 'Exam Date — Day'], ['exam_date_year', 'Exam Date — Year'],
    ['exam_age', 'Age'], ['exam_weight_actual', 'Weight — Actual (lbs)'], ['exam_weight_estimated', 'Weight — Estimated (lbs)'],
    ['exam_height_feet', 'Height — Feet'], ['exam_height_inches', 'Height — Inches'],
    ['exam_blood_pressure', 'Blood Pressure'], ['exam_pulse_rate', 'Pulse Rate'], ['exam_respiratory_rate', 'Respiratory Rate'],
    ['bed_hours_9pm_to_9am', 'Hours in Bed — 9PM to 9AM'], ['bed_hours_9am_to_9pm', 'Hours in Bed — 9AM to 9PM'],
    ['corrected_vision_left', 'Corrected Vision — Left Eye'], ['corrected_vision_right', 'Corrected Vision — Right Eye'],
  ]},
  { section: 'Examiner Signature & Facility', keys: [
    ['examiner_printed_name', 'Printed Name of Examiner'], ['examiner_title', 'Title of Examiner'],
    ['examiner_date_signed_month', 'Date Signed — Month'], ['examiner_date_signed_day', 'Date Signed — Day'], ['examiner_date_signed_year', 'Date Signed — Year'],
    ['examiner_npi', 'NPI Number'], ['medical_facility_name', 'Name of Medical Facility'], ['medical_facility_address', 'Address of Medical Facility'],
    ['medical_facility_phone_area', 'Facility Phone — Area Code'], ['medical_facility_phone_mid', 'Facility Phone — Middle 3'], ['medical_facility_phone_last4', 'Facility Phone — Last 4'],
  ]},
];

const TEXTAREA_FIELDS = [
  { section: 'Diagnosis & Disabilities', keys: [
    ['complete_diagnosis', '17. Complete Diagnosis with Most Significant Symptoms'],
    ['permanent_disability_a', '18A. Disability considered permanent/totally disabling'],
    ['exam_nutrition', '20. Nutrition'], ['exam_gait', '21. Gait'],
    ['exam_disabilities_restrict_activities', '25. What disabilities restrict listed activities/functions?'],
  ]},
  { section: 'Functional Assessment (Section VI cont.)', keys: [
    ['blind_explanation', '28A. Explanation if legally blind'],
    ['nursing_home_care_explanation', '29. Explanation if requires nursing home care'],
    ['mental_capacity_explanation', "30. Explanation if lacks mental capacity"],
    ['posture_and_appearance', '31. Posture and general appearance'],
    ['upper_extremity_restrictions', '32. Upper extremity restrictions'],
    ['lower_extremity_restrictions', '33. Lower extremity restrictions'],
    ['spine_trunk_neck_restrictions', '34. Spine, trunk, and neck restrictions'],
    ['other_pathology', '35. Other pathology'],
    ['leave_home_frequency', '36. How often can patient leave home?'],
  ]},
];

const ADL_CHECKBOXES = [
  ['needs_bathing', 'Bathing/Showering'], ['needs_feeding', 'Eating or Self-Feeding'], ['needs_dressing', 'Dressing'],
  ['needs_ambulating', 'Ambulating Within the Home'], ['needs_hygiene', 'Tending to Hygiene Needs'],
  ['needs_transferring', 'Transferring In/Out of Bed/Chair'], ['needs_toileting', 'Toileting'], ['needs_medication_management', 'Medication Management'],
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

const AdminVaExamFormPage = () => {
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
    if (!values.veteran_first_name?.trim() || !values.veteran_last_name?.trim()) {
      toast.error('Veteran First Name and Last Name are required.');
      return;
    }
    setSubmitting(true);
    setFilledPdfUrl(null);
    try {
      const forms = await pb.collection('va_forms').getList(1, 1, { filter: 'form_number = "21-2680"' });
      const vaForm = forms.items[0];
      if (!vaForm) {
        toast.error('Form 21-2680 has not been uploaded to the library yet.');
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
        <h1 className="text-2xl font-bold">VA Form 21-2680 — Examination for Housebound Status / Aid & Attendance</h1>
      </div>
      <p className="text-slate-500 mb-8">Fill in the answers below, then generate the completed PDF.</p>

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
        <h2 className="text-lg font-semibold mb-4">Item 8 — Relationship of Claimant to Veteran</h2>
        <RadioGroup
          label="Relationship"
          value={values.claimant_relationship}
          onChange={(v) => set('claimant_relationship', v)}
          options={[{ value: 'self', label: 'Self' }, { value: 'spouse', label: 'Spouse' }, { value: 'parent', label: 'Parent' }, { value: 'child', label: 'Child' }]}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Item 13 — Benefit Type</h2>
        <RadioGroup
          label="Benefit"
          value={values.benefit_type}
          onChange={(v) => set('benefit_type', v)}
          options={[{ value: 'smc', label: 'Special Monthly Compensation (SMC)' }, { value: 'smp', label: 'Special Monthly Pension (SMP)' }]}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Item 14A — Is the claimant hospitalized?</h2>
        <RadioGroup
          label="Hospitalized"
          value={values.is_hospitalized}
          onChange={(v) => set('is_hospitalized', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]}
        />
      </div>

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Item 27 — Does the patient require assistance with:</h2>
        <div className="grid grid-cols-2 gap-3">
          {ADL_CHECKBOXES.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox id={key} checked={!!values[key]} onCheckedChange={(v) => set(key, !!v)} />
              <Label htmlFor={key}>{label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-8 grid grid-cols-3 gap-4">
        <RadioGroup label="28A. Legally Blind?" value={values.is_legally_blind} onChange={(v) => set('is_legally_blind', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
        <RadioGroup label="29. Requires Nursing Home Care?" value={values.requires_nursing_home_care} onChange={(v) => set('requires_nursing_home_care', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
        <RadioGroup label="30. Has Mental Capacity?" value={values.has_mental_capacity} onChange={(v) => set('has_mental_capacity', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
      </div>

      {TEXTAREA_FIELDS.map(({ section, keys }) => (
        <div key={section} className="mb-8">
          <h2 className="text-lg font-semibold mb-4">{section}</h2>
          <div className="space-y-4">
            {keys.map(([key, label]) => (
              <div key={key}>
                <Label htmlFor={key}>{label}</Label>
                <Textarea id={key} value={values[key] || ''} onChange={(e) => set(key, e.target.value)} rows={2} />
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Item 37 — Locomotion Aids</h2>
        <RadioGroup label="Requires aids?" value={values.requires_locomotion_aids} onChange={(v) => set('requires_locomotion_aids', v)}
          options={[{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }]} />
        <div className="mt-3">
          <RadioGroup label="Distance able to walk" value={values.locomotion_aid_distance} onChange={(v) => set('locomotion_aid_distance', v)}
            options={[{ value: 'one_block', label: '1 Block' }, { value: 'five_to_six_blocks', label: '5-6 Blocks' }, { value: 'one_mile', label: '1 Mile' }]} />
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

export default AdminVaExamFormPage;
