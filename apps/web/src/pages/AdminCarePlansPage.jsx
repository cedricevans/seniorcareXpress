import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_FORM = {
  patient_id: '',
  caregiver_id: '',
  title: '',
  start_date: '',
  end_date: '',
  schedule: '',
  notes: '',
  status: 'active',
};

const AdminCarePlansPage = () => {
  const [carePlans, setCarePlans] = useState([]);
  const [patients, setPatients] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadData = async () => {
    setLoading(true);
    try {
      const [plans, pts, cgs] = await Promise.all([
        pb.collection('care_plans').getFullList({ expand: 'patient_id,caregiver_id', $autoCancel: false }),
        pb.collection('patients').getFullList({ sort: 'first_name', $autoCancel: false }),
        pb.collection('users').getFullList({ filter: 'role = "caregiver"', sort: 'name', $autoCancel: false }),
      ]);
      setCarePlans(plans);
      setPatients(pts);
      setCaregivers(cgs);
    } catch (err) {
      console.error('Failed to load care plans:', err);
      toast.error('Failed to load care plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async () => {
    if (!form.patient_id || !form.title) {
      toast.error('Patient and title are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        patient_id: form.patient_id,
        caregiver_id: form.caregiver_id || null,
        title: form.title,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        schedule: form.schedule ? JSON.parse(form.schedule) : null,
        notes: form.notes || '',
        status: form.status || 'active',
      };
      await pb.collection('care_plans').create(payload, { $autoCancel: false });
      toast.success('Care plan created');
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      loadData();
    } catch (err) {
      console.error('Failed to save care plan:', err);
      toast.error('Failed to save care plan (schedule must be valid JSON)');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this care plan?')) return;
    try {
      await pb.collection('care_plans').delete(id, { $autoCancel: false });
      toast.success('Care plan deleted');
      loadData();
    } catch (err) {
      console.error('Failed to delete care plan:', err);
      toast.error('Failed to delete care plan');
    }
  };

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Care Plans | SeniorCare Xpress Admin</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-primary" /> Care Plans
          </h1>
          <p className="text-muted-foreground mt-1">Create care plans and schedules for each patient.</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> New Care Plan
        </Button>
      </div>

      <Card className="border-0 shadow-soft rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead>Patient</TableHead>
                  <TableHead>Caregiver</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>End</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((__, j) => (
                        <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : carePlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      No care plans yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  carePlans.map((plan) => (
                    <TableRow key={plan.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">
                        {plan.expand?.patient_id?.first_name} {plan.expand?.patient_id?.last_name}
                      </TableCell>
                      <TableCell>{plan.expand?.caregiver_id?.name || plan.expand?.caregiver_id?.email || '—'}</TableCell>
                      <TableCell>{plan.title}</TableCell>
                      <TableCell className="capitalize text-sm text-muted-foreground">{plan.status || 'active'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{plan.start_date ? new Date(plan.start_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{plan.end_date ? new Date(plan.end_date).toLocaleDateString() : '—'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="hover:text-destructive" onClick={() => handleDelete(plan.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle>Create Care Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={form.patient_id} onValueChange={(val) => setForm((p) => ({ ...p, patient_id: val }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Caregiver</Label>
              <Select value={form.caregiver_id} onValueChange={(val) => setForm((p) => ({ ...p, caregiver_id: val }))}>
                <SelectTrigger><SelectValue placeholder="Assign caregiver" /></SelectTrigger>
                <SelectContent>
                  {caregivers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name || c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Start Date</Label>
                <Input type="date" value={form.start_date} onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input type="date" value={form.end_date} onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Schedule (JSON)</Label>
              <Textarea
                value={form.schedule}
                onChange={(e) => setForm((p) => ({ ...p, schedule: e.target.value }))}
                placeholder='{"monday": ["Bath", "Meal Prep"], "tuesday": ["Exercise"]}'
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(val) => setForm((p) => ({ ...p, status: val }))}>
                <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Create Plan'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCarePlansPage;
