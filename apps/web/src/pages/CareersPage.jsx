import React, { useState, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Mail, MapPin, Phone, Briefcase, GraduationCap, Users,
  FileText, ChevronRight, ChevronLeft, CheckCircle2, Loader2,
  Upload, AlertTriangle, Shield, Pen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import pb from '@/lib/pocketbaseClient.js';

/* ─────────────────────────────────────────────
   Shared field helpers
───────────────────────────────────────────── */
const Input = ({ label, name, type = 'text', placeholder, required, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      value={value || ''}
      onChange={e => onChange(name, e.target.value)}
      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-sm"
    />
  </div>
);

const Textarea = ({ label, name, required, placeholder, value, onChange, rows = 4 }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <textarea
      rows={rows}
      placeholder={placeholder || 'Please type your response here'}
      value={value || ''}
      onChange={e => onChange(name, e.target.value)}
      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-sm resize-none"
    />
  </div>
);

const Select = ({ label, name, required, options, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-1.5">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <select
      value={value || ''}
      onChange={e => onChange(name, e.target.value)}
      className="w-full border border-slate-200 rounded-xl px-4 py-3 text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition text-sm"
    >
      <option value="">Select…</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
);

const RadioGroup = ({ label, name, required, options, value, onChange }) => (
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      {label}{required && <span className="text-red-400 ml-1">*</span>}
    </label>
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(name, opt)}
          className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
            value === opt
              ? 'border-primary bg-primary text-white shadow-md'
              : 'border-slate-200 bg-white text-slate-600 hover:border-primary/50'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  </div>
);

const SectionDivider = ({ title }) => (
  <div className="flex items-center gap-3 col-span-full my-1">
    <div className="h-px flex-1 bg-slate-100" />
    <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</span>
    <div className="h-px flex-1 bg-slate-100" />
  </div>
);

/* ─────────────────────────────────────────────
   STEP DEFINITIONS
───────────────────────────────────────────── */
const STEPS = [
  { id: 'personal', label: 'Personal Info', icon: User },
  { id: 'background', label: 'Background', icon: Shield },
  { id: 'employment', label: 'Employment', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'references', label: 'References', icon: Users },
  { id: 'statement', label: 'Statement', icon: Pen },
];

/* ─────────────────────────────────────────────
   STEP 1 — Personal Info
───────────────────────────────────────────── */
const StepPersonal = ({ data, update }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div className="col-span-full">
      <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-medium">
        ⚠️ <strong>Notice:</strong> If you upload your resume below, you may skip the Employment History section.
      </div>
    </div>
    <Input label="First Name" name="first_name" required placeholder="First" value={data.first_name} onChange={update} />
    <Input label="Last Name" name="last_name" required placeholder="Last" value={data.last_name} onChange={update} />
    <Input label="Email" name="email" type="email" required placeholder="you@example.com" value={data.email} onChange={update} />
    <Input label="Cell Phone" name="cell_phone" type="tel" required placeholder="(123) 456-7890" value={data.cell_phone} onChange={update} />
    <Input label="Home Phone" name="home_phone" type="tel" placeholder="(123) 456-7890" value={data.home_phone} onChange={update} />
    <SectionDivider title="Address" />
    <Input label="Street Address" name="address" required placeholder="123 Main St" value={data.address} onChange={update} />
    <Input label="Address Line 2" name="address2" placeholder="Apt, Suite, etc." value={data.address2} onChange={update} />
    <Input label="City, State" name="city_state" required placeholder="Cincinnati, OH" value={data.city_state} onChange={update} />
    <Input label="Zip Code" name="zip_code" required placeholder="12345" value={data.zip_code} onChange={update} />
    <SectionDivider title="Resume Upload (Optional — Skips Employment History)" />
    <div className="col-span-full">
      <label className="block text-sm font-medium text-slate-700 mb-2">
        Upload Resume <span className="text-slate-400 text-xs">(PDF, DOC, DOCX)</span>
      </label>
      <label className="flex items-center gap-3 border-2 border-dashed border-slate-200 rounded-xl px-5 py-4 cursor-pointer hover:border-primary/50 hover:bg-slate-50 transition">
        <Upload className="w-5 h-5 text-slate-400 shrink-0" />
        <span className="text-sm text-slate-500">
          {data._resumeFile ? data._resumeFile.name : 'Click to choose file…'}
        </span>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={e => update('_resumeFile', e.target.files[0] || null)}
        />
      </label>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   STEP 2 — Background
───────────────────────────────────────────── */
const StepBackground = ({ data, update }) => (
  <div className="space-y-5">
    <Select
      label="Have you worked for SeniorCare Xpress before?"
      name="worked_before"
      required
      options={['Yes', 'No']}
      value={data.worked_before}
      onChange={update}
    />
    {data.worked_before === 'Yes' && (
      <Textarea
        label="If yes, please give the date, position, and reason for leaving."
        name="worked_before_details"
        value={data.worked_before_details}
        onChange={update}
      />
    )}
    <Select
      label="Work Authorization — Are you authorized to work in the United States?"
      name="work_authorization"
      required
      options={['Yes', 'No']}
      value={data.work_authorization}
      onChange={update}
    />
    <Select
      label="How did you hear about this opportunity?"
      name="how_heard"
      required
      options={['Indeed', 'Company Website', 'Employee Referral', 'Social Media', 'Job Fair', 'Other']}
      value={data.how_heard}
      onChange={update}
    />
    <Input
      label="Were you referred by a current employee? If so, please give their name."
      name="referral_name"
      placeholder="Employee name (if applicable)"
      value={data.referral_name}
      onChange={update}
    />

    <div className="h-px bg-slate-100 my-2" />
    <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl p-4 leading-relaxed">
      <strong>Criminal Record:</strong> Due to the nature of SeniorCare Xpress, it is necessary to ask about an applicant's conviction record, since this would have a direct effect on the ability to meet program objectives and requirements.
    </p>
    <Select
      label="Have you ever been convicted of any crime (excluding minor traffic offenses)?"
      name="criminal_record"
      required
      options={['No', 'Yes']}
      value={data.criminal_record}
      onChange={update}
    />
    {data.criminal_record === 'Yes' && (
      <Textarea
        label="If yes, please explain in full detail."
        name="criminal_record_details"
        required
        value={data.criminal_record_details}
        onChange={update}
      />
    )}
    <Textarea
      label="Our licensing standards require documentation regarding conviction of, or leaving employment due to: (1) Any sex offense, (2) Endangering children, (3) Corrupting another with drugs, (4) Trafficking in drugs, (5) Any crime of violence, (6) Child abuse or neglect. Have you been convicted of or left employment due to any of the above? Answer Yes or No and explain if applicable."
      name="licensing_disqualifiers"
      required
      rows={3}
      value={data.licensing_disqualifiers}
      onChange={update}
    />
    <RadioGroup
      label="Have you ever been discharged or asked to resign by an employer?"
      name="discharged"
      required
      options={['No', 'Yes']}
      value={data.discharged}
      onChange={update}
    />
    {data.discharged === 'Yes' && (
      <Textarea
        label="If yes, please explain."
        name="discharged_details"
        required
        value={data.discharged_details}
        onChange={update}
      />
    )}
  </div>
);

/* ─────────────────────────────────────────────
   STEP 3 — Employment History
───────────────────────────────────────────── */
const EmployerBlock = ({ num, data, update }) => {
  const f = (name) => data[`emp${num}_${name}`];
  const u = (name, val) => update(`emp${num}_${name}`, val);
  return (
    <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50 space-y-4">
      <p className="font-semibold text-slate-700 text-sm">{num === 1 ? 'Current or Most Recent Employer' : `Employer #${num}`}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="Company Name" name={`emp${num}_name`} placeholder="Company name" value={f('name')} onChange={update} />
        <Input label="Company Phone" name={`emp${num}_phone`} type="tel" placeholder="(123) 456-7890" value={f('phone')} onChange={update} />
        <Input label="Address" name={`emp${num}_address`} placeholder="Street address" value={f('address')} onChange={update} />
        <Input label="City, State, Zip" name={`emp${num}_city`} placeholder="City, OH 45000" value={f('city')} onChange={update} />
        <Input label="From Date" name={`emp${num}_from_date`} type="date" value={f('from_date')} onChange={update} />
        <Input label="To Date" name={`emp${num}_to_date`} type="date" placeholder="Present" value={f('to_date')} onChange={update} />
        <RadioGroup label="May We Contact?" name={`emp${num}_may_contact`} options={['Yes', 'No']} value={f('may_contact')} onChange={update} />
      </div>
      <Textarea label="Responsibilities & Duties" name={`emp${num}_duties`} rows={3} value={f('duties')} onChange={update} />
      <Textarea label="Reason for Leaving" name={`emp${num}_reason`} rows={2} value={f('reason')} onChange={update} />
    </div>
  );
};

const StepEmployment = ({ data, update }) => (
  <div className="space-y-6">
    <RadioGroup
      label="Are you currently employed?"
      name="currently_employed"
      required
      options={['Yes', 'No']}
      value={data.currently_employed}
      onChange={update}
    />
    <p className="text-xs text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
      Include military service assignments and volunteer activities. You may exclude organization names that indicate race, color, religion, gender, national origin, age, disability, or other protected status.
    </p>
    <EmployerBlock num={1} data={data} update={update} />
    <EmployerBlock num={2} data={data} update={update} />
    <EmployerBlock num={3} data={data} update={update} />
  </div>
);

/* ─────────────────────────────────────────────
   STEP 4 — Education
───────────────────────────────────────────── */
const StepEducation = ({ data, update }) => (
  <div className="grid grid-cols-1 gap-5">
    <Select
      label="Highest level of education completed"
      name="education_level"
      required
      options={[
        'Some High School', 'High School Diploma / GED', 'Some College',
        "Associate's Degree", "Bachelor's Degree", "Master's Degree",
        'Doctorate', 'Trade / Vocational Certificate',
      ]}
      value={data.education_level}
      onChange={update}
    />
    <Input label="Name of institution(s)" name="institution" required placeholder="School or university name" value={data.institution} onChange={update} />
    <RadioGroup label="Did you graduate?" name="graduated" required options={['Yes', 'No']} value={data.graduated} onChange={update} />
    <Textarea label="Degree(s) or Certification(s)" name="degrees" placeholder="List your degrees or certifications" value={data.degrees} onChange={update} />
    <Textarea label="List any professional licenses" name="licenses" placeholder="Professional licenses" value={data.licenses} onChange={update} />
    <Input label="Licensure Name and Number" name="licensure_number" placeholder="License name and number" value={data.licensure_number} onChange={update} />
  </div>
);

/* ─────────────────────────────────────────────
   STEP 5 — References
───────────────────────────────────────────── */
const ReferenceBlock = ({ num, data, update }) => {
  const f = (name) => data[`ref${num}_${name}`];
  return (
    <div className="border border-slate-100 rounded-2xl p-5 bg-slate-50">
      <p className="font-semibold text-slate-700 text-sm mb-4">Reference #{num}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input label="First Name" name={`ref${num}_first`} required placeholder="First" value={f('first')} onChange={update} />
        <Input label="Last Name" name={`ref${num}_last`} required placeholder="Last" value={f('last')} onChange={update} />
        <Input label="Company" name={`ref${num}_company`} required placeholder="Employer or organization" value={f('company')} onChange={update} />
        <Input label="Relationship" name={`ref${num}_relationship`} required placeholder="Supervisor, Colleague…" value={f('relationship')} onChange={update} />
        <Input label="Phone" name={`ref${num}_phone`} type="tel" required placeholder="(123) 456-7890" value={f('phone')} onChange={update} />
        <Input label="Email" name={`ref${num}_email`} type="email" required placeholder="reference@example.com" value={f('email')} onChange={update} />
        <Input label="Years Known" name={`ref${num}_years_known`} required placeholder="e.g. 3" value={f('years_known')} onChange={update} />
      </div>
    </div>
  );
};

const StepReferences = ({ data, update }) => (
  <div className="space-y-6">
    <ReferenceBlock num={1} data={data} update={update} />
    <ReferenceBlock num={2} data={data} update={update} />
    <ReferenceBlock num={3} data={data} update={update} />
  </div>
);

/* ─────────────────────────────────────────────
   STEP 6 — Applicant Statement
───────────────────────────────────────────── */
const STATEMENT_TEXT = `All of the information I have supplied on this Application is true and complete to the best of my knowledge and I have not knowingly withheld any information that, if known to SeniorCare Xpress, would affect my Application unfavorably.

In the event I enter into an employment agreement with SeniorCare Xpress, and if SeniorCare Xpress discovers at any time during the employment that any of the statements or answers on this Application are false, misleading or incomplete, I understand that I may be terminated immediately from my job.

I give SeniorCare Xpress my permission to conduct an investigation regarding the information contained in this Application and to contact any former employer, school, college or university, utility company, credit or finance bureau, personal or professional reference, or any other appropriate source for the purpose of gathering information about my character, general reputation, credit, education or employment record.

If extended an offer of employment, I agree to submit a medical examination that may include testing for drugs or alcohol prior to beginning employment, and I understand that any employment offer is conditioned upon passing such examination and/or testing.

I understand and agree that this Application, by itself or together with other SeniorCare Xpress policies and documents, does not create a contract of employment between SeniorCare Xpress and me. If hired, my employment can be terminated by either SeniorCare Xpress or me at any time with or without cause and with or without notice.

I agree that any claim or lawsuit I have now or in the future against SeniorCare Xpress must be filed within one (1) year from the date of the act or omission that is the subject of my claim, or within the applicable statute of limitations, whichever is shorter.`;

const StepStatement = ({ data, update }) => (
  <div className="space-y-6">
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 max-h-64 overflow-y-auto">
      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{STATEMENT_TEXT}</p>
    </div>
    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest text-center">
      *** Please Read the Complete Statement Above ***
    </p>
    <RadioGroup
      label="I have read and agree to this applicant statement."
      name="statement_agreed"
      required
      options={['Yes', 'No']}
      value={data.statement_agreed}
      onChange={update}
    />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
      <Input label="Sign Below — First Name" name="signature_first" required placeholder="First" value={data.signature_first} onChange={update} />
      <Input label="Sign Below — Last Name" name="signature_last" required placeholder="Last" value={data.signature_last} onChange={update} />
    </div>
    <p className="text-xs text-slate-400 text-center">
      By typing your name above you are providing your electronic signature and affirming your agreement to the statement above.
    </p>
    <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-medium text-center">
      *** ALL APPLICATIONS MUST HAVE A COMPLETED CM QUALIFICATION ASSESSMENT — LOCATED ON THE CAREER TAB ***
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   MAIN PAGE
───────────────────────────────────────────── */
const StepComponents = [StepPersonal, StepBackground, StepEmployment, StepEducation, StepReferences, StepStatement];

const CareersPage = () => {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const topRef = useRef(null);

  const update = (name, value) => setFormData(prev => ({ ...prev, [name]: value }));
  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: 'smooth' });

  const validateStep = () => {
    const d = formData;
    if (step === 0) {
      if (!d.first_name || !d.last_name || !d.email || !d.cell_phone || !d.address || !d.city_state || !d.zip_code)
        return 'Please complete all required personal information fields.';
    }
    if (step === 1) {
      if (!d.worked_before || !d.work_authorization || !d.how_heard || !d.criminal_record || !d.licensing_disqualifiers || !d.discharged)
        return 'Please answer all required background questions.';
      if (d.criminal_record === 'Yes' && !d.criminal_record_details) return 'Please explain your criminal record in detail.';
      if (d.discharged === 'Yes' && !d.discharged_details) return 'Please explain the discharge or resignation.';
    }
    if (step === 2) {
      if (!d.currently_employed) return 'Please indicate whether you are currently employed.';
    }
    if (step === 3) {
      if (!d.education_level || !d.institution || !d.graduated) return 'Please complete all required education fields.';
    }
    if (step === 4) {
      for (let n = 1; n <= 3; n++) {
        if (!d[`ref${n}_first`] || !d[`ref${n}_last`] || !d[`ref${n}_company`] ||
            !d[`ref${n}_relationship`] || !d[`ref${n}_phone`] || !d[`ref${n}_email`] || !d[`ref${n}_years_known`])
          return `Please complete all required fields for Reference #${n}.`;
      }
    }
    if (step === 5) {
      if (d.statement_agreed !== 'Yes') return 'You must agree to the applicant statement to submit.';
      if (!d.signature_first || !d.signature_last) return 'Please provide your electronic signature (first and last name).';
    }
    return null;
  };

  const handleNext = () => {
    const err = validateStep();
    if (err) { setError(err); scrollTop(); return; }
    setError('');
    setStep(s => s + 1);
    scrollTop();
  };

  const handleBack = () => { setError(''); setStep(s => s - 1); scrollTop(); };

  const handleSubmit = async () => {
    const err = validateStep();
    if (err) { setError(err); scrollTop(); return; }
    setError('');
    setSubmitting(true);
    try {
      const { _resumeFile, ...payload } = formData;
      const record = await pb.collection('job_applications').create(payload);
      if (_resumeFile) {
        const fd = new FormData();
        fd.append('resume', _resumeFile);
        await pb.collection('job_applications').update(record.id, fd);
      }
      setSubmitted(true);
      scrollTop();
    } catch (e) {
      console.error(e);
      setError('Something went wrong submitting your application. Please try again or call us at 513-687-7866.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <>
        <Helmet><title>Application Submitted | SeniorCare Xpress Careers</title></Helmet>
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-24">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-3xl shadow-xl border border-slate-100 p-12 max-w-lg w-full text-center"
          >
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-3xl font-heading font-bold text-slate-900 mb-3">Application Submitted!</h2>
            <p className="text-slate-500 leading-relaxed mb-6">
              Thank you for applying to SeniorCare Xpress. Our team will review your application and be in touch within 3–5 business days.
            </p>
            <p className="text-sm text-slate-400 mb-8">
              Questions? Call <a href="tel:5136877866" className="text-primary font-semibold">513-687-7866</a> or email{' '}
              <a href="mailto:contact@seniorcarexpress.com" className="text-primary font-semibold">contact@seniorcarexpress.com</a>
            </p>
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 font-medium">
              *** Remember: ALL APPLICATIONS MUST HAVE A COMPLETED CM QUALIFICATION ASSESSMENT — LOCATED ON THE CAREER TAB ***
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  const CurrentStep = StepComponents[step];

  return (
    <>
      <Helmet>
        <title>Careers | SeniorCare Xpress Employment Application</title>
        <meta name="description" content="Apply to join the SeniorCare Xpress care team. We are seeking compassionate individuals dedicated to serving seniors and their families." />
      </Helmet>

      {/* Hero */}
      <div className="bg-gradient-to-br from-primary to-primary/80 py-20 px-4 text-white text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }} className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-5 py-2 mb-6">
            <Briefcase className="w-4 h-4" />
            <span className="text-sm font-medium tracking-wide">Now Hiring</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-4">Employment Application</h1>
          <p className="text-lg text-white/80 max-w-xl mx-auto">
            SeniorCare Xpress is seeking compassionate individuals dedicated to improving the quality of life for seniors. Complete the application below to apply.
          </p>
        </motion.div>
      </div>

      {/* Wizard */}
      <div className="bg-slate-50 min-h-screen py-12 px-4">
        <div className="max-w-3xl mx-auto" ref={topRef}>

          {/* Step indicator */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between gap-1 overflow-x-auto pb-1">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const isActive = i === step;
                const isDone = i < step;
                return (
                  <div key={s.id} className="flex items-center shrink-0">
                    <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all duration-300 ${
                      isActive ? 'bg-primary text-white' : isDone ? 'bg-green-50 text-green-600' : 'bg-slate-50 text-slate-400'
                    }`}>
                      {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                      <span className="text-xs font-semibold hidden sm:block">{s.label}</span>
                    </div>
                    {i < STEPS.length - 1 && (
                      <div className={`h-px w-3 md:w-6 mx-1 transition-colors duration-300 ${i < step ? 'bg-green-400' : 'bg-slate-200'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card */}
          <div className="bg-white rounded-3xl shadow-lg border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-slate-100 px-8 py-5 flex items-center gap-3">
              {React.createElement(STEPS[step].icon, { className: 'w-5 h-5 text-primary' })}
              <div>
                <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">Step {step + 1} of {STEPS.length}</p>
                <h2 className="text-xl font-heading font-bold text-slate-900">{STEPS[step].label}</h2>
              </div>
            </div>

            <div className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={step}
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.2 }}
                >
                  <CurrentStep data={formData} update={update} />
                </motion.div>
              </AnimatePresence>

              {error && (
                <div className="mt-6 flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                  <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              <div className="flex justify-between mt-8 pt-6 border-t border-slate-100">
                <Button variant="outline" onClick={handleBack} disabled={step === 0} className="rounded-full px-6 gap-2 disabled:opacity-30">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                {step < STEPS.length - 1 ? (
                  <Button onClick={handleNext} className="rounded-full px-8 gap-2">
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button onClick={handleSubmit} disabled={submitting} className="rounded-full px-8 gap-2 bg-green-600 hover:bg-green-700 text-white">
                    {submitting
                      ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                      : <><FileText className="w-4 h-4" /> Submit Application</>}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <p className="text-center text-sm text-slate-400 mt-6">
            Need help? Call <a href="tel:5136877866" className="text-primary font-semibold">513-687-7866</a> or email{' '}
            <a href="mailto:contact@seniorcarexpress.com" className="text-primary font-semibold">contact@seniorcarexpress.com</a>
          </p>
        </div>
      </div>
    </>
  );
};

export default CareersPage;

