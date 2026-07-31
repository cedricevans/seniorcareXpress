import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, UserPlus, FileText, Pencil, X } from 'lucide-react';
import { toast } from 'sonner';

const FIELDS = [
  { section: "Veteran's Identification", keys: [
    ['veteran_first_name', 'First Name'],
    ['veteran_last_name', 'Last Name'],
    ['veteran_middle_initial', 'Middle Initial'],
    ['veteran_ssn_first3', 'SSN — first 3'],
    ['veteran_ssn_middle2', 'SSN — middle 2'],
    ['veteran_ssn_last4', 'SSN — last 4'],
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
    ['claimant_ssn_first3', 'SSN — first 3'],
    ['claimant_ssn_middle2', 'SSN — middle 2'],
    ['claimant_ssn_last4', 'SSN — last 4'],
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
  };

  const startEdit = (profile) => {
    setEditingId(profile.id);
    setValues(profile);
    setShowForm(true);
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
      const payload = {
        applicant_type: values.applicant_type || 'veteran',
        first_name: values.veteran_first_name || '',
        last_name: values.veteran_last_name || '',
        status: values.status || 'intake',
        ...values,
      };
      if (editingId) {
        await pb.collection('va_cases').update(editingId, payload);
        toast.success('Profile updated');
      } else {
        await pb.collection('va_cases').create(payload);
        toast.success('Profile created');
      }
      cancelForm();
      await loadProfiles();
    } catch (err) {
      console.error(err);
      toast.error('Something went wrong saving the profile');
    } finally {
      setSaving(false);
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
    </div>
  );
};

export default AdminVaIntakePage;
