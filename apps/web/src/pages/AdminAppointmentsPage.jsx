import { useState, useEffect } from 'react';
import { pocketbaseClient as pb } from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const STATUS_COLORS = {
  scheduled: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  'no-show': 'bg-yellow-100 text-yellow-800',
};

const EMPTY_FORM = {
  title: '',
  description: '',
  appointment_date: '',
  appointment_time: '',
  duration_minutes: 60,
  status: 'scheduled',
  appointment_type: 'check-up',
  patient_id: '',
  caregiver_id: '',
};

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [appts, pts, cgs] = await Promise.all([
        pb.collection('appointments').getFullList({ sort: '-appointment_date', expand: 'patient_id,caregiver_id' }),
        pb.collection('patients').getFullList({ sort: 'first_name' }),
        pb.collection('users').getFullList({ filter: 'role = "caregiver"', sort: 'name' }),
      ]);
      setAppointments(appts);
      setPatients(pts);
      setCaregivers(cgs);
    } catch (e) {
      setError('Failed to load appointments: ' + e.message);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setDialogOpen(true);
  }

  function openEdit(appt) {
    setForm({
      title: appt.title || '',
      description: appt.description || '',
      appointment_date: appt.appointment_date?.split(' ')[0] || '',
      appointment_time: appt.appointment_time || '',
      duration_minutes: appt.duration_minutes || 60,
      status: appt.status || 'scheduled',
      appointment_type: appt.appointment_type || 'check-up',
      patient_id: appt.patient_id || '',
      caregiver_id: appt.caregiver_id || '',
    });
    setEditId(appt.id);
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.title || !form.appointment_date || !form.patient_id) {
      setError('Title, date, and patient are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await pb.collection('appointments').update(editId, form);
      } else {
        await pb.collection('appointments').create(form);
      }
      setDialogOpen(false);
      loadAll();
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this appointment?')) return;
    try {
      await pb.collection('appointments').delete(id);
      setAppointments(prev => prev.filter(a => a.id !== id));
    } catch (e) {
      alert('Delete failed: ' + e.message);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      await pb.collection('appointments').update(id, { status });
      setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    } catch (e) {
      alert('Update failed: ' + e.message);
    }
  }

  const filtered = appointments.filter(a =>
    a.title?.toLowerCase().includes(search.toLowerCase()) ||
    a.expand?.patient_id?.first_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.expand?.caregiver_id?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Appointments</h1>
        <Button onClick={openCreate}>+ Schedule Appointment</Button>
      </div>

      <Input
        placeholder="Search by title, patient, or caregiver..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {error && <p className="text-red-500 text-sm">{error}</p>}

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Patient</TableHead>
              <TableHead>Caregiver</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No appointments found.
                </TableCell>
              </TableRow>
            )}
            {filtered.map(appt => (
              <TableRow key={appt.id}>
                <TableCell className="font-medium">{appt.title}</TableCell>
                <TableCell>
                  {appt.expand?.patient_id
                    ? `${appt.expand.patient_id.first_name} ${appt.expand.patient_id.last_name}`
                    : '—'}
                </TableCell>
                <TableCell>{appt.expand?.caregiver_id?.name || '—'}</TableCell>
                <TableCell>{appt.appointment_date?.split(' ')[0] || '—'}</TableCell>
                <TableCell>{appt.appointment_time || '—'}</TableCell>
                <TableCell className="capitalize">{appt.appointment_type?.replace('-', ' ') || '—'}</TableCell>
                <TableCell>
                  <Select value={appt.status} onValueChange={v => handleStatusChange(appt.id, v)}>
                    <SelectTrigger className="w-32 h-7 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {['scheduled', 'completed', 'cancelled', 'no-show'].map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openEdit(appt)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(appt.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? 'Edit Appointment' : 'Schedule Appointment'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <Input placeholder="Title *" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
            <Input placeholder="Description" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Input type="date" value={form.appointment_date} onChange={e => setForm(p => ({ ...p, appointment_date: e.target.value }))} />
              <Input type="time" value={form.appointment_time} onChange={e => setForm(p => ({ ...p, appointment_time: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.patient_id} onValueChange={v => setForm(p => ({ ...p, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Patient *" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.caregiver_id} onValueChange={v => setForm(p => ({ ...p, caregiver_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Caregiver" /></SelectTrigger>
                <SelectContent>
                  {caregivers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select value={form.appointment_type} onValueChange={v => setForm(p => ({ ...p, appointment_type: v }))}>
                <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                <SelectContent>
                  {['check-up', 'medication', 'therapy', 'specialist', 'emergency', 'other'].map(t => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={form.status} onValueChange={v => setForm(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  {['scheduled', 'completed', 'cancelled', 'no-show'].map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Input
              type="number"
              placeholder="Duration (minutes)"
              value={form.duration_minutes}
              onChange={e => setForm(p => ({ ...p, duration_minutes: parseInt(e.target.value) || 60 }))}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
