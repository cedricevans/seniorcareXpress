import React, { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { Save, Plus, Trash2, Download, Printer, RotateCcw, Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';
import pb from '@/lib/pocketbaseClient';

const DRAFT_KEY = 'scx_service_agreement_draft';
const BRAND_LOGO_URL = 'https://horizons-cdn.hostinger.com/0f92c1a5-75e3-4878-84c5-4c29eda99ea0/6cf179a531307fd05365d487c05a8a26.png';

const emptyServiceRequest = () => ({ id: crypto.randomUUID(), service: '', description: '', frequency: '' });
const emptyServiceDescription = () => ({ id: crypto.randomUUID(), description: '', frequency: '', duration: '' });

const initialData = {
  effectiveDate: '',
  clientName: '',
  dob: '',
  ssnLast4: '',
  sex: '',
  clientAddress: '',
  telephone: '',
  alternatePhone: '',
  clientEmail: '',
  physicianName: '',
  physicianPhone: '',
  guardianName: '',
  guardianRelationship: '',
  guardianPhone: '',
  emergencyContact: '',
  emEmail: '',
  emPhone: '',
  initialContactDate: '',
  referralDate: '',
  referralSource: '',
  startOfCareDate: '',
  hourlyRate: '',
  serviceTypes: { personalCare: false, homemaking: false, companion: false },
  serviceRequests: [emptyServiceRequest()],
  serviceDescriptions: [emptyServiceDescription()],
  vehicleAccess: '',
  paymentType: '',
  thirdPartyName: '',
  insuranceClaimNumber: '',
  insuranceIdNumber: '',
  rates: {
    weekdayUnder3: '', weekdayOver4: '', weekday24: '', weekdayLiveIn: '',
    weekendUnder3: '', weekendOver4: '', weekend24: '', weekendLiveIn: '',
  },
  depositAmount: '',
  depositWaived: false,
  depositWaivedReason: '',
  clientSignature: '',
  clientSignatureDate: '',
  repSignature: '',
  repSignatureDate: '',
  repNameRelationship: '',
};

function SectionCard({ number, title, children }) {
  return (
    <div className="bg-white rounded-xl border border-border shadow-sm overflow-hidden">
      <div className="flex items-baseline gap-3 px-6 pt-5 pb-3 border-b border-border/60">
        {number && (
          <span className="flex-none w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center">
            {number}
          </span>
        )}
        <h2 className="text-base font-semibold text-foreground tracking-tight">{title}</h2>
      </div>
      <div className="p-6 pt-4">{children}</div>
    </div>
  );
}

function Field({ label, children, hint }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="text-xs text-muted-foreground/70">{hint}</span>}
    </label>
  );
}

const inputClass =
  'w-full px-3 py-2 rounded-lg border border-input text-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow bg-white';

export default function ServiceAgreementPage() {
  const [data, setData] = useState(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY);
      return saved ? { ...initialData, ...JSON.parse(saved) } : initialData;
    } catch {
      return initialData;
    }
  });
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | submitted | error
  const [exportingPdf, setExportingPdf] = useState(false);
  const [dirty, setDirty] = useState(false);

  const update = useCallback((field, value) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setDirty(true);
  }, []);

  const updateNested = useCallback((group, field, value) => {
    setData((prev) => ({ ...prev, [group]: { ...prev[group], [field]: value } }));
    setDirty(true);
  }, []);

  const updateRow = useCallback((group, id, field, value) => {
    setData((prev) => ({
      ...prev,
      [group]: prev[group].map((row) => (row.id === id ? { ...row, [field]: value } : row)),
    }));
    setDirty(true);
  }, []);

  const addRow = useCallback((group, factory) => {
    setData((prev) => ({ ...prev, [group]: [...prev[group], factory()] }));
    setDirty(true);
  }, []);

  const removeRow = useCallback((group, id) => {
    setData((prev) => ({ ...prev, [group]: prev[group].filter((row) => row.id !== id) }));
    setDirty(true);
  }, []);

  const handleSaveDraft = () => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
      setDirty(false);
      toast.success('Draft saved on this device');
    } catch {
      toast.error('Could not save draft — check browser storage permissions');
    }
  };

  const handleReset = () => {
    if (!window.confirm('Clear all fields on this form? This cannot be undone.')) return;
    setData(initialData);
    setDirty(true);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // ignore
    }
  };

  const handleDownloadPdf = async () => {
    setExportingPdf(true);
    try {
      const { generateServiceAgreementPdf } = await import('@/lib/serviceAgreementPdf');
      await generateServiceAgreementPdf(data);
      toast.success('PDF downloaded');
    } catch (error) {
      console.error(error);
      toast.error('Could not generate PDF. Please try again.');
    } finally {
      setExportingPdf(false);
    }
  };

  const handleSubmit = async () => {
    if (!data.clientName.trim()) {
      toast.error('Client name is required before submitting');
      return;
    }
    setSaveStatus('saving');
    try {
      await pb.collection('service_agreements').create(
        {
          client_name: data.clientName,
          client_email: data.clientEmail || data.emEmail || '',
          form_data: data,
          status: 'submitted',
        },
        { $autoCancel: false }
      );
      setSaveStatus('submitted');
      setDirty(false);
      try {
        localStorage.removeItem(DRAFT_KEY);
      } catch {
        // ignore
      }
      toast.success('Service agreement submitted — a copy has been emailed to our office.');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error(error);
      setSaveStatus('error');
      toast.error('Could not submit the agreement. Please try again or contact us directly.');
    }
  };

  return (
    <div className="bg-muted/30 min-h-screen">
      <Helmet>
        <title>Service Agreement | SeniorCare Xpress</title>
      </Helmet>

      {/* Sticky header / action bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-border px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-3">
          <img src={BRAND_LOGO_URL} alt="SeniorCare Xpress" className="h-9 w-auto object-contain" />
          <div>
            <div className="text-xs font-semibold tracking-wide text-primary uppercase">SeniorCare Xpress</div>
            <h1 className="text-lg font-bold text-foreground leading-tight">Service Agreement</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {dirty && saveStatus === 'idle' && (
            <span className="text-sm text-muted-foreground hidden sm:inline">Unsaved changes</span>
          )}
          <button
            onClick={() => window.print()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <Printer className="w-4 h-4" /> Print
          </button>
          <button
            onClick={handleDownloadPdf}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors disabled:opacity-60"
          >
            {exportingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Export PDF
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Reset
          </button>
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
          >
            <Save className="w-4 h-4" /> Save Draft
          </button>
          <button
            onClick={handleSubmit}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit & Email
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto bg-white shadow-sm">
        {/* Branded document header band */}
        <div className="bg-white px-6 sm:px-10 py-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border">
          <div className="flex items-center gap-4">
            <img src={BRAND_LOGO_URL} alt="SeniorCare Xpress logo" className="h-14 w-auto object-contain" />
            <div>
              <div className="text-xl font-bold leading-tight text-primary">SeniorCare Xpress</div>
              <div className="text-sm text-muted-foreground">Compassionate, Professional Senior Care</div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground sm:text-right space-y-0.5">
            <div>513.687.7866</div>
            <div>seniorcarexpress.com</div>
            <div>P.O. Box 18442, Fairfield, OH 45018</div>
          </div>
        </div>
        <div className="h-1.5 bg-secondary" />

        <div className="px-4 sm:px-10 py-8 space-y-6 bg-muted/30">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Service Agreement</h1>
            <p className="text-sm text-muted-foreground mt-2">
              Please review this agreement carefully — it sets out the understanding between you (the
              "Client") and SeniorCare Xpress (the "Agency") about the services requested and provided.
              Contact us before signing if anything needs clarifying.
            </p>
          </div>

        <SectionCard title="Agreement & Client Information">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Effective Date">
              <input type="date" className={inputClass} value={data.effectiveDate} onChange={(e) => update('effectiveDate', e.target.value)} />
            </Field>
            <Field label="Client Name">
              <input className={inputClass} value={data.clientName} onChange={(e) => update('clientName', e.target.value)} />
            </Field>
            <Field label="Date of Birth">
              <input type="date" className={inputClass} value={data.dob} onChange={(e) => update('dob', e.target.value)} />
            </Field>
            <Field label="SSN (last 4 digits)">
              <input maxLength={4} className={inputClass} value={data.ssnLast4} onChange={(e) => update('ssnLast4', e.target.value.replace(/\D/g, ''))} />
            </Field>
            <Field label="Sex">
              <div className="flex gap-4 pt-2">
                {['M', 'F'].map((opt) => (
                  <label key={opt} className="flex items-center gap-2 text-sm text-foreground">
                    <input type="radio" name="sex" checked={data.sex === opt} onChange={() => update('sex', opt)} className="accent-primary" />
                    {opt === 'M' ? 'Male' : 'Female'}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Client Address">
              <input className={inputClass} value={data.clientAddress} onChange={(e) => update('clientAddress', e.target.value)} />
            </Field>
            <Field label="Telephone #">
              <input type="tel" className={inputClass} value={data.telephone} onChange={(e) => update('telephone', e.target.value)} />
            </Field>
            <Field label="Alternate #">
              <input type="tel" className={inputClass} value={data.alternatePhone} onChange={(e) => update('alternatePhone', e.target.value)} />
            </Field>
            <Field label="Client Email" hint="We'll send a copy of this agreement here">
              <input type="email" className={inputClass} value={data.clientEmail} onChange={(e) => update('clientEmail', e.target.value)} />
            </Field>
            <Field label="Physician">
              <input className={inputClass} value={data.physicianName} onChange={(e) => update('physicianName', e.target.value)} />
            </Field>
            <Field label="Physician Phone">
              <input type="tel" className={inputClass} value={data.physicianPhone} onChange={(e) => update('physicianPhone', e.target.value)} />
            </Field>
          </div>

          <div className="mt-6 pt-5 border-t border-border/60">
            <h3 className="text-sm font-semibold text-foreground mb-3">Responsible Party or Legal Guardian</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Name">
                <input className={inputClass} value={data.guardianName} onChange={(e) => update('guardianName', e.target.value)} />
              </Field>
              <Field label="Relationship">
                <input className={inputClass} value={data.guardianRelationship} onChange={(e) => update('guardianRelationship', e.target.value)} />
              </Field>
              <Field label="Phone">
                <input type="tel" className={inputClass} value={data.guardianPhone} onChange={(e) => update('guardianPhone', e.target.value)} />
              </Field>
              <Field label="Emergency Contact">
                <input className={inputClass} value={data.emergencyContact} onChange={(e) => update('emergencyContact', e.target.value)} />
              </Field>
              <Field label="Emergency Email">
                <input type="email" className={inputClass} value={data.emEmail} onChange={(e) => update('emEmail', e.target.value)} />
              </Field>
              <Field label="Emergency Phone">
                <input type="tel" className={inputClass} value={data.emPhone} onChange={(e) => update('emPhone', e.target.value)} />
              </Field>
            </div>
          </div>
        </SectionCard>

        <SectionCard number={1} title="Initial Contact Date">
          <Field label="Date SeniorCare Xpress first contacted the client about services">
            <input type="date" className={`${inputClass} sm:max-w-xs`} value={data.initialContactDate} onChange={(e) => update('initialContactDate', e.target.value)} />
          </Field>
        </SectionCard>

        <SectionCard number={2} title="Referral">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Date of referral">
              <input type="date" className={inputClass} value={data.referralDate} onChange={(e) => update('referralDate', e.target.value)} />
            </Field>
            <Field label="Referral source">
              <input className={inputClass} value={data.referralSource} onChange={(e) => update('referralSource', e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        <SectionCard number={3} title="Start of Care Date">
          <Field label="Start of care date">
            <input type="date" className={`${inputClass} sm:max-w-xs`} value={data.startOfCareDate} onChange={(e) => update('startOfCareDate', e.target.value)} />
          </Field>
        </SectionCard>

        <SectionCard number={4} title="Service Rate">
          <p className="text-sm text-muted-foreground mb-3">
            Charges are billed weekly and payable by cash or check through the administrative office
            only. Please do not pay Care Managers directly.
          </p>
          <Field label="Rate per hour ($)" hint="Billed weekly">
            <input type="number" min="0" step="0.01" className={`${inputClass} sm:max-w-xs`} value={data.hourlyRate} onChange={(e) => update('hourlyRate', e.target.value)} />
          </Field>
        </SectionCard>

        <SectionCard number={5} title="Services Requested by Client">
          <p className="text-sm text-muted-foreground mb-4">
            Describe what the client or their representative wants from the caregiver, in their own
            words — e.g. help in and out of bed, bathing, getting dressed.
          </p>
          <div className="flex flex-wrap gap-4 mb-5">
            {[
              ['personalCare', 'Personal Care Services'],
              ['homemaking', 'Homemaking Services'],
              ['companion', 'Companion Services'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={data.serviceTypes[key]}
                  onChange={(e) => updateNested('serviceTypes', key, e.target.checked)}
                  className="w-4 h-4 accent-primary"
                />
                {label}
              </label>
            ))}
          </div>

          <div className="space-y-3">
            {data.serviceRequests.map((row, i) => (
              <div key={row.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start bg-muted/40 rounded-lg p-3">
                <Field label={i === 0 ? 'Service requested' : ''}>
                  <input className={inputClass} value={row.service} onChange={(e) => updateRow('serviceRequests', row.id, 'service', e.target.value)} placeholder="e.g. Bathing assistance" />
                </Field>
                <Field label={i === 0 ? 'Description / delivery' : ''}>
                  <input className={inputClass} value={row.description} onChange={(e) => updateRow('serviceRequests', row.id, 'description', e.target.value)} />
                </Field>
                <Field label={i === 0 ? 'Visit frequency / duration' : ''}>
                  <input className={inputClass} value={row.frequency} onChange={(e) => updateRow('serviceRequests', row.id, 'frequency', e.target.value)} placeholder="e.g. 3x/week, 4 hrs" />
                </Field>
                <button
                  onClick={() => removeRow('serviceRequests', row.id)}
                  disabled={data.serviceRequests.length === 1}
                  className={`self-center sm:mt-6 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ${data.serviceRequests.length === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  aria-label="Remove row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addRow('serviceRequests', emptyServiceRequest)}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
          >
            <Plus className="w-4 h-4" /> Add another service
          </button>
        </SectionCard>

        <SectionCard number={6} title="Service Plan: Frequency & Duration">
          <div className="space-y-3">
            {data.serviceDescriptions.map((row, i) => (
              <div key={row.id} className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_1fr_auto] gap-2 items-start bg-muted/40 rounded-lg p-3">
                <Field label={i === 0 ? 'Description' : ''}>
                  <input className={inputClass} value={row.description} onChange={(e) => updateRow('serviceDescriptions', row.id, 'description', e.target.value)} />
                </Field>
                <Field label={i === 0 ? 'Frequency' : ''}>
                  <input className={inputClass} value={row.frequency} onChange={(e) => updateRow('serviceDescriptions', row.id, 'frequency', e.target.value)} />
                </Field>
                <Field label={i === 0 ? 'Duration' : ''}>
                  <input className={inputClass} value={row.duration} onChange={(e) => updateRow('serviceDescriptions', row.id, 'duration', e.target.value)} />
                </Field>
                <button
                  onClick={() => removeRow('serviceDescriptions', row.id)}
                  disabled={data.serviceDescriptions.length === 1}
                  className={`self-center sm:mt-6 p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ${data.serviceDescriptions.length === 1 ? 'opacity-30 cursor-not-allowed' : ''}`}
                  aria-label="Remove row"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={() => addRow('serviceDescriptions', emptyServiceDescription)}
            className="mt-3 flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80"
          >
            <Plus className="w-4 h-4" /> Add another line
          </button>
          <p className="text-xs text-muted-foreground/80 mt-4">
            Updates to this agreement are documented in the client's record. The client may cancel
            services at any time and is only responsible for payment of services already received.
          </p>
        </SectionCard>

        <SectionCard number={7} title="Questions or Complaints">
          <p className="text-sm text-foreground">
            Call SeniorCare Xpress at <span className="font-semibold">513.687.7866</span> for
            information, questions, or complaints about services.
          </p>
        </SectionCard>

        <SectionCard number={8} title="Authorization & Payment">
          <Field label="Authorize SeniorCare Xpress access to my personal vehicle for appointments and errands?">
            <div className="flex gap-4 pt-1">
              {[['accept', 'I Accept'], ['decline', 'Decline']].map(([val, label]) => (
                <label key={val} className="flex items-center gap-2 text-sm text-foreground">
                  <input type="radio" name="vehicleAccess" checked={data.vehicleAccess === val} onChange={() => update('vehicleAccess', val)} className="accent-primary" />
                  {label}
                </label>
              ))}
            </div>
          </Field>

          <div className="mt-5">
            <Field label="Payment will be made by">
              <div className="flex gap-4 pt-1">
                {[['private', 'Private pay'], ['third-party', 'Third party']].map(([val, label]) => (
                  <label key={val} className="flex items-center gap-2 text-sm text-foreground">
                    <input type="radio" name="paymentType" checked={data.paymentType === val} onChange={() => update('paymentType', val)} className="accent-primary" />
                    {label}
                  </label>
                ))}
              </div>
            </Field>
          </div>

          {data.paymentType === 'third-party' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <Field label="Third-party payor name">
                <input className={inputClass} value={data.thirdPartyName} onChange={(e) => update('thirdPartyName', e.target.value)} />
              </Field>
              <Field label="Insurance claim number">
                <input className={inputClass} value={data.insuranceClaimNumber} onChange={(e) => update('insuranceClaimNumber', e.target.value)} />
              </Field>
              <Field label="Insurance ID number">
                <input className={inputClass} value={data.insuranceIdNumber} onChange={(e) => update('insuranceIdNumber', e.target.value)} />
              </Field>
            </div>
          )}

          <p className="text-xs text-muted-foreground/80 mt-4">
            Clients are billed weekly; payment is due within 3 calendar days of the billing date.
            Accepted methods: cash (in office only) or check. Never pay your Care Manager directly.
          </p>

          <div className="mt-6 pt-5 border-t border-border/60">
            <p className="text-sm text-muted-foreground mb-3">
              A $70.00 Initial Comprehensive Nursing Assessment fee applies to new clients and recurs
              every 60 days, as required by the state of Ohio. Service rates below:
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="text-left text-muted-foreground">
                    <th className="py-2 pr-2 font-medium"></th>
                    <th className="py-2 px-2 font-medium">&le; 3.0 hrs</th>
                    <th className="py-2 px-2 font-medium">&ge; 4.0 hrs</th>
                    <th className="py-2 px-2 font-medium">24 hrs (hourly)</th>
                    <th className="py-2 px-2 font-medium">Live-in (24 hrs)</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Weekdays', 'weekdayUnder3', 'weekdayOver4', 'weekday24', 'weekdayLiveIn'],
                    ['Weekends', 'weekendUnder3', 'weekendOver4', 'weekend24', 'weekendLiveIn'],
                  ].map(([rowLabel, k1, k2, k3, k4]) => (
                    <tr key={rowLabel} className="border-t border-border/60">
                      <td className="py-2 pr-2 font-medium text-muted-foreground">{rowLabel}</td>
                      {[k1, k2, k3, k4].map((k) => (
                        <td key={k} className="py-1.5 px-2">
                          <input
                            type="number" min="0" step="0.01"
                            className={inputClass}
                            value={data.rates[k]}
                            onChange={(e) => updateNested('rates', k, e.target.value)}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground/80 mt-3">Minimum shift length is 4 hours, minimum 3 days per week, unless otherwise agreed.</p>
          </div>
        </SectionCard>

        <SectionCard number={9} title="Deposit">
          <p className="text-sm text-muted-foreground mb-3">
            A deposit equal to two weeks of service is expected before services begin, held without
            interest, and refunded for any unused portion when services end. The deposit may not be
            used to prepay the first invoice.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Total deposit amount ($)">
              <input type="number" min="0" step="0.01" className={inputClass} value={data.depositAmount} onChange={(e) => update('depositAmount', e.target.value)} />
            </Field>
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground mt-4">
            <input type="checkbox" checked={data.depositWaived} onChange={(e) => update('depositWaived', e.target.checked)} className="w-4 h-4 accent-primary" />
            SeniorCare Xpress has agreed to waive the deposit
          </label>
          {data.depositWaived && (
            <Field label="Reason deposit was waived">
              <input className={`${inputClass} mt-3`} value={data.depositWaivedReason} onChange={(e) => update('depositWaivedReason', e.target.value)} />
            </Field>
          )}
        </SectionCard>

        <SectionCard title="Key Policies">
          <div className="space-y-4 text-sm text-muted-foreground">
            <p><span className="font-semibold text-foreground">Overdue accounts.</span> Accounts unpaid 3 days past the billing due date are considered overdue; interest of $15.00/week applies after 4 days, services may pause on day 4 until paid, and returned checks incur a $35.00 fee.</p>
            <p><span className="font-semibold text-foreground">Cancellations.</span> The client may cancel at any time and is only billed for services already rendered. A reasonable travel/staff charge may apply for late-notice cancellations, except where the Agency believes the client is in danger.</p>
            <p><span className="font-semibold text-foreground">Termination.</span> Either party may terminate at any time. Fees due at termination are payable immediately; any money for services not rendered is refunded within 5 business days.</p>
            <p><span className="font-semibold text-foreground">Light housekeeping.</span> Limited to tidying the client's living spaces, dish washing/spot-cleaning, sweeping, vacuuming, and tidying bathrooms after use — not general housekeeping.</p>
            <p><span className="font-semibold text-foreground">Transportation.</span> $10.00 round trip plus $0.58/mile, added to the weekly invoice. Caregivers may not drive a client's vehicle without signed authorization, and the client assumes liability for claims involving their own vehicle.</p>
            <p><span className="font-semibold text-foreground">Severe weather.</span> If travel is unsafe, the Agency will notify the client, reschedule, and not charge for the missed day.</p>
            <p><span className="font-semibold text-foreground">Supplies & equipment.</span> The client supplies personal care items (including gloves) and equipment; extra charges apply if the Agency provides them instead.</p>
            <p><span className="font-semibold text-foreground">Late pick-up/arrival.</span> $2.00 per minute, no cap, billed on the next invoice.</p>
            <p><span className="font-semibold text-foreground">Rate changes.</span> Rates may increase in line with Ohio minimum wage law.</p>
          </div>
        </SectionCard>

        <SectionCard title="Signatures">
          <p className="text-sm text-muted-foreground mb-4">
            By signing, you acknowledge that you've read, understand, and agree to the terms of this
            Service Agreement, and confirm receipt of the information above.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Client's signature (type full name)">
              <input className={inputClass} value={data.clientSignature} onChange={(e) => update('clientSignature', e.target.value)} />
            </Field>
            <Field label="Date">
              <input type="date" className={inputClass} value={data.clientSignatureDate} onChange={(e) => update('clientSignatureDate', e.target.value)} />
            </Field>
            <Field label="Client representative's signature (type full name)">
              <input className={inputClass} value={data.repSignature} onChange={(e) => update('repSignature', e.target.value)} />
            </Field>
            <Field label="Date">
              <input type="date" className={inputClass} value={data.repSignatureDate} onChange={(e) => update('repSignatureDate', e.target.value)} />
            </Field>
            <Field label="Representative's printed name & relationship">
              <input className={inputClass} value={data.repNameRelationship} onChange={(e) => update('repNameRelationship', e.target.value)} />
            </Field>
          </div>
        </SectionCard>

        <div className="flex justify-end pb-4">
          <button
            onClick={handleSubmit}
            disabled={saveStatus === 'saving'}
            className="flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary/90 disabled:opacity-60 transition-colors"
          >
            {saveStatus === 'saving' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Submit Agreement & Email Us a Copy
          </button>
        </div>
        </div>

        {/* Branded document footer */}
        <div className="bg-white border-t border-border px-6 sm:px-10 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-3">
            <img src={BRAND_LOGO_URL} alt="SeniorCare Xpress logo" className="h-8 w-auto object-contain" />
            <span className="font-semibold text-primary">SeniorCare Xpress</span>
          </div>
          <div className="text-muted-foreground">513.687.7866 &middot; seniorcarexpress.com &middot; Fairfield, OH</div>
        </div>
      </div>
    </div>
  );
}
