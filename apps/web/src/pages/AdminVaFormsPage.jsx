import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, ChevronRight, ChevronDown, UserPlus, Upload, Loader2, Download, Settings2 } from 'lucide-react';
import { toast } from 'sonner';

const FORMS = [
  {
    number: '21-0779',
    title: 'Request for Nursing Home Information',
    description: 'In connection with a claim for Aid and Attendance',
    path: '/admin/va-forms/21-0779',
  },
  {
    number: '21-0845',
    title: 'Authorization to Disclose Personal Information',
    description: 'Authorization to disclose personal information to a third party',
    path: '/admin/va-forms/21-0845',
  },
  {
    number: '21-2680',
    title: 'Examination for Housebound Status or Aid & Attendance',
    description: 'Examination for housebound status or permanent need for regular aid and attendance',
    path: '/admin/va-forms/21-2680',
  },
  {
    number: '21P-8416',
    title: 'Medical Expense Report',
    description: 'Report unreimbursed medical, in-home care, and mileage expenses',
    path: '/admin/va-forms/21p-8416',
  },
  {
    number: '21P-527EZ',
    title: 'Application for Veterans Pension',
    description: 'Sections I-IX available (identity, service, marital status, children, income summary)',
    path: '/admin/va-forms/21p-527ez',
  },
  {
    number: '21P-534EZ',
    title: 'Application for D.I.C., Survivors Pension, and/or Accrued Benefits',
    description: 'Sections I-II available (identity, contact info, what you\'re claiming). Remaining sections must be completed manually.',
    path: '/admin/va-forms/21p-534ez',
  },
];

const AdminVaFormsPage = () => {
  const { currentUser } = useAuth();
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [versions, setVersions] = useState([]);
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [pdfFile, setPdfFile] = useState(null);

  const loadVersions = useCallback(async () => {
    setLoadingVersions(true);
    try {
      const list = await pb.collection('va_forms').getFullList({ expand: 'updated_by' });
      list.sort((a, b) => a.form_number.localeCompare(b.form_number) || (b.created || '').localeCompare(a.created || ''));
      setVersions(list);
    } catch (err) {
      console.error(err);
      toast.error('Could not load form version history');
    } finally {
      setLoadingVersions(false);
    }
  }, []);

  useEffect(() => {
    if (libraryOpen && versions.length === 0) loadVersions();
  }, [libraryOpen, versions.length, loadVersions]);

  const set = (key, val) => setFormValues((prev) => ({ ...prev, [key]: val }));

  const handleUploadNewVersion = async () => {
    if (!formValues.form_number?.trim()) {
      toast.error('Form number is required');
      return;
    }
    if (!pdfFile) {
      toast.error('A PDF file is required');
      return;
    }
    setUploading(true);
    try {
      const existing = await pb.collection('va_forms').getFullList({
        filter: `form_number = "${formValues.form_number}" && is_current = true`,
      });
      await Promise.all(existing.map((f) => pb.collection('va_forms').update(f.id, { is_current: false })));

      const data = new FormData();
      data.append('form_number', formValues.form_number);
      data.append('title', formValues.title || '');
      data.append('category', formValues.category || 'other');
      data.append('revision_date', formValues.revision_date || '');
      data.append('effective_date', formValues.effective_date || '');
      data.append('is_current', 'true');
      data.append('notes', formValues.notes || '');
      data.append('pdf_file', pdfFile);
      if (currentUser?.id) data.append('updated_by', currentUser.id);
      data.append('field_map', '{}');

      await pb.collection('va_forms').create(data);
      toast.success('New form version uploaded');
      setDialogOpen(false);
      setFormValues({});
      setPdfFile(null);
      await loadVersions();
    } catch (err) {
      console.error(err);
      toast.error('Could not upload new version');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-2">
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">VA Forms</h1>
      </div>
      <p className="text-slate-500 mb-6">Select a form to enter veteran information and generate the completed PDF.</p>

      <Link
        to="/admin/va-intake"
        className="inline-flex items-center gap-2 mb-8 px-4 py-2.5 rounded-lg bg-primary text-white font-medium text-sm hover:bg-primary/90 transition-colors"
      >
        <UserPlus className="w-4 h-4" /> Start VA Intake (create a veteran/claimant profile)
      </Link>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {FORMS.map((form) => (
          <Link
            key={form.number}
            to={form.path}
            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 hover:border-primary hover:shadow-md transition-all duration-200"
          >
            <div>
              <div className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">VA Form {form.number}</div>
              <div className="font-semibold text-slate-900 mb-1">{form.title}</div>
              <div className="text-sm text-slate-500">{form.description}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
          </Link>
        ))}
      </div>

      <Collapsible open={libraryOpen} onOpenChange={setLibraryOpen}>
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors"
          >
            {libraryOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            <Settings2 className="w-4 h-4" />
            Manage form versions
            <span className="text-slate-400 font-normal">— admin only</span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="border border-slate-200 rounded-xl bg-slate-50 p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-slate-500 max-w-md">
                Every version of every VA form ever uploaded, so staff can never accidentally use an
                outdated revision. Only the version marked "Current" fills new submissions.
              </p>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="shrink-0">
                    <Upload className="w-3.5 h-3.5 mr-1.5" /> Upload New Version
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader>
                    <DialogTitle>Upload New Form Version</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-2">
                    <div>
                      <Label htmlFor="form_number">Form Number</Label>
                      <Input id="form_number" placeholder="e.g. 21P-527EZ" value={formValues.form_number || ''} onChange={(e) => set('form_number', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input id="title" value={formValues.title || ''} onChange={(e) => set('title', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="revision_date">Revision Date</Label>
                        <Input id="revision_date" type="date" value={formValues.revision_date || ''} onChange={(e) => set('revision_date', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="effective_date">Effective Date</Label>
                        <Input id="effective_date" type="date" value={formValues.effective_date || ''} onChange={(e) => set('effective_date', e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="notes">Notes</Label>
                      <Input id="notes" placeholder="What changed in this revision?" value={formValues.notes || ''} onChange={(e) => set('notes', e.target.value)} />
                    </div>
                    <div>
                      <Label htmlFor="pdf_file">PDF File</Label>
                      <Input id="pdf_file" type="file" accept="application/pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
                      <p className="text-xs text-slate-400 mt-1">
                        Uploading marks the current version of this form number as superseded. Field
                        mapping for the new PDF must be configured separately before staff can fill it.
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button onClick={handleUploadNewVersion} disabled={uploading}>
                      {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Uploading...</> : 'Upload'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {loadingVersions ? (
              <p className="text-slate-400 text-sm">Loading...</p>
            ) : (
              <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Form</TableHead>
                      <TableHead>Revision</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Updated By</TableHead>
                      <TableHead className="text-right">PDF</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {versions.map((f) => (
                      <TableRow key={f.id} className={!f.is_current ? 'opacity-50' : ''}>
                        <TableCell className="font-medium">{f.form_number}</TableCell>
                        <TableCell>{f.revision_date ? f.revision_date.slice(0, 10) : '—'}</TableCell>
                        <TableCell>
                          {f.is_current ? <Badge>Current</Badge> : <Badge variant="secondary">Superseded</Badge>}
                        </TableCell>
                        <TableCell>{f.expand?.updated_by?.name || f.expand?.updated_by?.email || '—'}</TableCell>
                        <TableCell className="text-right">
                          {f.pdf_file && (
                            <a
                              href={pb.files.getURL(f, f.pdf_file)}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center text-primary text-sm font-medium"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" /> View
                            </a>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default AdminVaFormsPage;
