import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import apiServerClient from '@/lib/apiServerClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, User, FileText, Download, Package, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

const FORM_ROUTES = {
  '21-0779': '/admin/va-forms/21-0779',
  '21-0845': '/admin/va-forms/21-0845',
  '21-2680': '/admin/va-forms/21-2680',
  '21P-8416': '/admin/va-forms/21p-8416',
  '21P-527EZ': '/admin/va-forms/21p-527ez',
  '21P-534EZ': '/admin/va-forms/21p-534ez',
};

const CHECKLIST_ITEMS = [
  ['checklist_correct_forms', 'Correct VA forms used'],
  ['checklist_info_verified', 'Veteran information verified'],
  ['checklist_signatures_obtained', 'Required signatures obtained'],
  ['checklist_medical_docs_attached', 'Medical documentation attached'],
  ['checklist_financial_docs_attached', 'Financial documents attached'],
  ['checklist_evidence_reviewed', 'Supporting evidence reviewed'],
  ['checklist_supervisor_approved', 'Final approval by supervisor'],
];

const STATUS_BADGE = {
  blank: <Badge variant="secondary">Blank</Badge>,
  filled: <Badge>Filled</Badge>,
  reviewed: <Badge variant="secondary">Reviewed</Badge>,
  submitted: <Badge>Submitted</Badge>,
};

const AdminVaCaseDetailPage = () => {
  const { caseId } = useParams();
  const [vaCase, setVaCase] = useState(null);
  const [caseForms, setCaseForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingChecklist, setSavingChecklist] = useState(false);
  const [generatingPacket, setGeneratingPacket] = useState(false);
  const [packetUrl, setPacketUrl] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [caseRecord, forms] = await Promise.all([
        pb.collection('va_cases').getOne(caseId),
        pb.collection('va_case_forms').getFullList({ filter: `case_id = "${caseId}"`, expand: 'form_id' }),
      ]);
      setVaCase(caseRecord);
      setCaseForms(forms);
    } catch (err) {
      console.error(err);
      toast.error('Could not load case');
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => { load(); }, [load]);

  const checklistComplete = vaCase ? CHECKLIST_ITEMS.every(([key]) => vaCase[key]) : false;

  const toggleChecklistItem = async (key, value) => {
    setSavingChecklist(true);
    try {
      const updated = await pb.collection('va_cases').update(caseId, { [key]: value });
      setVaCase(updated);
    } catch (err) {
      console.error(err);
      toast.error('Could not update checklist');
    } finally {
      setSavingChecklist(false);
    }
  };

  const handleGeneratePacket = async () => {
    if (!checklistComplete) {
      toast.error('Complete the staff review checklist before generating the packet');
      return;
    }
    setGeneratingPacket(true);
    setPacketUrl(null);
    try {
      const res = await apiServerClient.fetch(`/packets/${caseId}/generate`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || 'Failed to generate packet');
        return;
      }
      const updated = await res.json();
      setPacketUrl(pb.files.getURL(updated, updated.packet_pdf));
      toast.success('Packet generated');
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong generating the packet');
    } finally {
      setGeneratingPacket(false);
    }
  };

  if (loading) {
    return <div className="max-w-4xl mx-auto py-10 px-4 text-slate-400 text-sm">Loading case...</div>;
  }
  if (!vaCase) {
    return <div className="max-w-4xl mx-auto py-10 px-4 text-slate-400 text-sm">Case not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <Link to="/admin/va-intake" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to VA Intake
      </Link>

      <div className="flex items-center gap-3 mb-2">
        <User className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">{vaCase.first_name} {vaCase.last_name}</h1>
        <Badge variant="secondary" className="capitalize">{vaCase.status}</Badge>
      </div>
      <p className="text-slate-500 mb-8">
        {vaCase.applicant_type === 'surviving_spouse' ? 'Surviving Spouse' : 'Veteran'}
        {vaCase.va_file_number && <> &middot; VA File #{vaCase.va_file_number}</>}
        {vaCase.email && <> &middot; {vaCase.email}</>}
      </p>

      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4" /> Forms on This Case
        </h2>
        {caseForms.length === 0 ? (
          <p className="text-slate-400 text-sm">No forms started yet for this case.</p>
        ) : (
          <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Form</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {caseForms.map((cf) => {
                  const formNumber = cf.expand?.form_id?.form_number;
                  return (
                    <TableRow key={cf.id}>
                      <TableCell className="font-medium">
                        {formNumber} — {cf.expand?.form_id?.title}
                      </TableCell>
                      <TableCell>{STATUS_BADGE[cf.status] || cf.status}</TableCell>
                      <TableCell className="text-right space-x-3">
                        {formNumber && FORM_ROUTES[formNumber] && (
                          <Link to={FORM_ROUTES[formNumber]} className="text-primary text-sm font-medium">
                            Open Form
                          </Link>
                        )}
                        {cf.filled_pdf && (
                          <a
                            href={pb.files.getURL(cf, cf.filled_pdf)}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-primary text-sm font-medium"
                          >
                            <Download className="w-3.5 h-3.5 mr-1" /> PDF
                          </a>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <div className="mb-10">
        <h2 className="text-lg font-semibold mb-4">Staff Review Checklist</h2>
        <div className="border border-slate-200 rounded-xl bg-white p-5 space-y-3">
          {CHECKLIST_ITEMS.map(([key, label]) => (
            <div key={key} className="flex items-center gap-2">
              <Checkbox
                id={key}
                checked={!!vaCase[key]}
                disabled={savingChecklist}
                onCheckedChange={(v) => toggleChecklistItem(key, !!v)}
              />
              <Label htmlFor={key}>{label}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-slate-200 rounded-xl bg-white p-5">
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Package className="w-4 h-4" /> Application Packet
        </h2>
        <p className="text-sm text-slate-500 mb-4">
          Generates a cover letter, document checklist, internal case summary, and client copy, merged
          with every filled VA form on this case into a single packet PDF.
        </p>
        <Button onClick={handleGeneratePacket} disabled={generatingPacket || !checklistComplete}>
          {generatingPacket ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</> : 'Generate VA Aid & Attendance Packet'}
        </Button>
        {!checklistComplete && (
          <p className="text-xs text-amber-600 mt-2">Complete the staff review checklist above to enable packet generation.</p>
        )}
        {packetUrl && (
          <a href={packetUrl} target="_blank" rel="noreferrer" className="ml-4 inline-flex items-center text-primary font-medium text-sm">
            <Download className="w-4 h-4 mr-1" /> Download Packet
          </a>
        )}
      </div>
    </div>
  );
};

export default AdminVaCaseDetailPage;
