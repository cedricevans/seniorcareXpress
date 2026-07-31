import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Loader2, UserPlus, FileText, Pencil, Trash2, X, ChevronRight, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { splitSsn, joinSsn } from '@/lib/vaFieldSplit';

const NEXT_FORMS = [
  { number: '21-0779', label: 'Nursing Home Info', path: '/admin/va-forms/21-0779' },
  { number: '21-0845', label: 'Authorization to Disclose', path: '/admin/va-forms/21-0845' },
  { number: '21-2680', label: 'Aid & Attendance Exam', path: '/admin/va-forms/21-2680' },
  { number: '21P-8416', label: 'Medical Expense Report', path: '/admin/va-forms/21p-8416' },
  { number: '21P-527EZ', label: 'Veterans Pension', path: '/admin/va-forms/21p-527ez' },
  { number: '21P-534EZ', label: 'D.I.C. / Survivors Pension', path: '/admin/va-forms/21p-534ez' },
];

const FIELDS = [
  { section: "Veteran's Identification", keys: [
    ['veteran_first_name', 'First Name'],
    ['veteran_last_name', 'Last Name'],
    ['veteran_middle_initial', 'Middle Initial'],
    ['veteran_ssn', 'SSN'],
    ['va_file_number', 'VA File Number'],
    ['veteran_service_number', 'Service Number'],
    ['veteran_dob_month', 'DOB — Month'],
    ['veteran_dob_day', 'DOB — Day'],
    ['veteran_dob_year', 'DOB — Year'],
  ]},
  { section: "Claimant's Identification (only if claimant is NOT the veteran)", keys: [
    ['claimant_first_name', 'First Name'],
    ['claimant_last_name', 'Last Name'],
    ['claimant_middle_initial', 'Middle Initial'],
    ['claimant_ssn', 'SSN'],
    ['claimant_va_file_number', 'VA File Number (if applicable)'],
    ['claimant_dob_month', 'DOB — Month'],
    ['claimant_dob_day', 'DOB — Day'],
    ['claimant_dob_year', 'DOB — Year'],
  ]},
  { section: 'Contact Information', keys: [
    ['mailing_address_street', 'Address — Street'],
    ['mailing_address_apt', 'Apt/Unit'],
    ['mailing_address_city', 'City'],
    ['mailing_address_state', 'State'],
    ['mailing_address_country', 'Country (2-letter)'],
    ['mailing_address_zip5', 'ZIP Code'],
    ['phone_area', 'Phone — Area Code'],
    ['phone_mid', 'Phone — Middle 3'],
    ['phone_last4', 'Phone — Last 4'],
    ['email', 'Email'],
  ]},
];

const emptyForm = () => ({ applicant_type: 'veteran' });

const AdminVaIntakePage = () => {
  const [profiles, setProfiles] = useState([]);
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [values, setValues] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [justSaved, setJustSaved] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteFormCount, setDeleteFormCount] = useState(0);
  const [deleting, setDeleting] = useState(false);

  const set = (key, val) => setValues((prev) => ({ ...prev, [key]: val }));

  const loadProfiles = useCallback(async () => {
    setLoadingProfiles(true);
    try {
      const list = await pb.collection('va_cases').getFullList();
      setProfiles(list);
    } catch (err) {
      console.error('Failed to load VA profiles', err);
      toast.error('Could not load existing profiles');
    } finally {
      setLoadingProfiles(false);
    }
  }, []);

  useEffect(() => { loadProfiles(); }, [loadProfiles]);

  const startNew = () => {
    setEditingId(null);
    setValues(emptyForm());
    setShowForm(true);
    setJustSaved(null);
  };

  const startEdit = (profile) => {
    setEditingId(profile.id);
    setValues({
      ...profile,
      veteran_ssn: joinSsn(profile.veteran_ssn_first3, profile.veteran_ssn_middle2, profile.veteran_ssn_last4),
      claimant_ssn: joinSsn(profile.claimant_ssn_first3, profile.claimant_ssn_middle2, profile.claimant_ssn_last4),
    });
    setShowForm(true);
    setJustSaved(null);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setValues(emptyForm());
  };

  const handleSave = async () => {
    if (!values.veteran_first_name?.trim() || !values.veteran_last_name?.trim()) {
      toast.error('Veteran First Name and Last Name are required.');
      return;
    }
    setSaving(true);
    try {
      const veteranSsn = splitSsn(values.veteran_ssn);
      const claimantSsn = splitSsn(values.claimant_ssn);
      const payload = {
        applicant_type: values.applicant_type || 'veteran',
        first_name: values.veteran_first_name || '',
        last_name: values.veteran_last_name || '',
        status: values.status || 'intake',
        ...values,
        veteran_ssn_first3: veteranSsn.first3, veteran_ssn_middle2: veteranSsn.middle2, veteran_ssn_last4: veteranSsn.last4,
        claimant_ssn_first3: claimantSsn.first3, claimant_ssn_middle2: claimantSsn.middle2, claimant_ssn_last4: claimantSsn.last4,
      };
      delete payload.veteran_ssn;
      delete payload.claimant_ssn;
      let saved;
      if (editingId) {
        saved = await pb.collection('va_cases').update(editingId, payload);
        toast.success('Profile updated');
      } else {
        saved = await pb.collection('va_cases').create(payload);
        toast.success('Profile created');
      }
      setShowForm(false);
      setEditingId(null);
      setValues(emptyForm());
      setJustSaved(saved);
      await loadProfiles();
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong saving the profile');
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async (profile) => {
    setDeleteTarget(profile);
    try {
      const linkedForms = await pb.collection('va_case_forms').getFullList({ filter: `case_id = "${profile.id}"` });
      setDeleteFormCount(linkedForms.length);
    } catch (err) {
      console.error('Failed to check linked forms', err);
      setDeleteFormCount(0);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await pb.collection('va_cases').delete(deleteTarget.id);
      toast.success('Profile deleted');
      if (justSaved?.id === deleteTarget.id) setJustSaved(null);
      setDeleteTarget(null);
      await loadProfiles();
    } catch (err) {
      console.error(err);
      toast.error('Could not delete profile');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <div className="flex items-center gap-3 mb-2">
        <UserPlus className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">VA Intake</h1>
      </div>
      <p className="text-slate-500 mb-8">
        Create a veteran/claimant profile once, then use it in any VA form via "Import an existing profile" —
        no need to retype the same information for every form.
      </p>

      {!showForm && (
        <Button onClick={startNew} className="mb-8">
          <UserPlus className="w-4 h-4 mr-2" /> New Profile
        </Button>
      )}

      {showForm && (
        <div className="border border-slate-200 rounded-xl p-6 mb-10 bg-white">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">{editingId ? 'Edit Profile' : 'New Profile'}</h2>
            <button type="button" onClick={cancelForm} className="text-slate-400 hover:text-red-500 flex items-center gap-1 text-sm">
              <X className="w-4 h-4" /> Cancel
            </button>
          </div>

          {FIELDS.map(({ section, keys }) => (
            <div key={section} className="mb-8">
              <h3 className="text-sm font-semibold mb-4">{section}</h3>
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

          <Button onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving...</> : 'Save Profile'}
          </Button>
        </div>
      )}

      {justSaved && (
        <div className="border border-primary/20 rounded-xl p-6 mb-10 bg-primary/5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <h2 className="font-semibold text-slate-900">
                  Profile saved for {justSaved.first_name} {justSaved.last_name}
                </h2>
                <p className="text-sm text-slate-500 mt-0.5">Which form does this person need?</p>
              </div>
            </div>
            <button type="button" onClick={() => setJustSaved(null)} className="text-slate-400 hover:text-slate-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {NEXT_FORMS.map((f) => (
              <Link
                key={f.number}
                to={`${f.path}?profile=${justSaved.id}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm hover:border-primary hover:shadow-sm transition-all"
              >
                <div>
                  <div className="text-xs font-semibold text-primary">{f.number}</div>
                  <div className="text-slate-700">{f.label}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </Link>
            ))}
          </div>
          <Link to={`/admin/va-cases/${justSaved.id}`} className="text-sm font-medium text-primary hover:underline">
            Or go to this person's case page →
          </Link>
        </div>
      )}

      <h2 className="text-lg font-semibold mb-4">Existing Profiles</h2>
      {loadingProfiles ? (
        <p className="text-slate-400 text-sm">Loading profiles…</p>
      ) : profiles.length === 0 ? (
        <p className="text-slate-400 text-sm">No profiles yet. Create one above to get started.</p>
      ) : (
        <div className="border border-slate-200 rounded-xl bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>VA File Number</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.first_name} {p.last_name}</TableCell>
                  <TableCell>{p.va_file_number || '—'}</TableCell>
                  <TableCell>{p.phone_area ? `(${p.phone_area}) ${p.phone_mid}-${p.phone_last4}` : '—'}</TableCell>
                  <TableCell className="capitalize">{p.status || '—'}</TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button variant="outline" size="sm" onClick={() => startEdit(p)}>
                      <Pencil className="w-3.5 h-3.5 mr-1.5" /> Edit
                    </Button>
                    <Link to={`/admin/va-cases/${p.id}`}>
                      <Button variant="outline" size="sm">
                        View Case
                      </Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => confirmDelete(p)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                      <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="mt-8">
        <Link to="/admin/va-forms" className="inline-flex items-center gap-1.5 text-primary font-medium text-sm">
          <FileText className="w-4 h-4" /> Go to VA Forms to select a form for one of these profiles
        </Link>
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this profile?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && (
                <>
                  This permanently deletes the profile for <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong>.
                  {deleteFormCount > 0 && (
                    <>
                      {' '}It also deletes {deleteFormCount} form{deleteFormCount === 1 ? '' : 's'} started for this
                      person, including any generated PDFs. This cannot be undone.
                    </>
                  )}
                  {deleteFormCount === 0 && ' This cannot be undone.'}
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {deleting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deleting...</> : 'Delete Profile'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminVaIntakePage;
