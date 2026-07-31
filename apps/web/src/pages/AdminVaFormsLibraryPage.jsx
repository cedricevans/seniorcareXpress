import React, { useCallback, useEffect, useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { FileText, Upload, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';

const AdminVaFormsLibraryPage = () => {
  const { currentUser } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [pdfFile, setPdfFile] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await pb.collection('va_forms').getFullList({ expand: 'updated_by' });
      list.sort((a, b) => a.form_number.localeCompare(b.form_number));
      setForms(list);
    } catch (err) {
      console.error(err);
      toast.error('Could not load VA forms library');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

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
      // Supersede the current version of this form_number, if any.
      const existing = await pb.collection('va_forms').getFullList({
        filter: `form_number = "${formValues.form_number}" && is_current = true`,
      });
      await Promise.all(
        existing.map((f) => pb.collection('va_forms').update(f.id, { is_current: false }))
      );

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
      // New version starts with no field_map — must be defined separately before it can be filled.
      data.append('field_map', '{}');

      await pb.collection('va_forms').create(data);
      toast.success('New form version uploaded');
      setDialogOpen(false);
      setFormValues({});
      setPdfFile(null);
      await load();
    } catch (err) {
      console.error(err);
      toast.error('Could not upload new version');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">VA Forms Library — Version Control</h1>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Upload className="w-4 h-4 mr-2" /> Upload New Version</Button>
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
                  Uploading a new version marks the current version of this form number as superseded.
                  Field mapping for the new PDF must be configured separately before staff can fill it.
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
      <p className="text-slate-500 mb-8">
        Every version of every VA form ever uploaded, so staff can never accidentally use an outdated
        revision. Only the version marked "Current" is used to fill forms for cases.
      </p>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading...</p>
      ) : (
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Form</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Revision</TableHead>
                <TableHead>Effective</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Updated By</TableHead>
                <TableHead className="text-right">PDF</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forms.map((f) => (
                <TableRow key={f.id} className={!f.is_current ? 'opacity-50' : ''}>
                  <TableCell className="font-medium">{f.form_number}</TableCell>
                  <TableCell>{f.title}</TableCell>
                  <TableCell>{f.revision_date ? f.revision_date.slice(0, 10) : '—'}</TableCell>
                  <TableCell>{f.effective_date ? f.effective_date.slice(0, 10) : '—'}</TableCell>
                  <TableCell>
                    {f.is_current ? (
                      <Badge>Current</Badge>
                    ) : (
                      <Badge variant="secondary">Superseded</Badge>
                    )}
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
  );
};

export default AdminVaFormsLibraryPage;
