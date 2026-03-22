import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { UserCheck, Users, Heart, Plus, Trash2, Search } from 'lucide-react';
import { toast } from 'sonner';

// ─── Caregiver Assignments Tab ────────────────────────────────────────────────
const CaregiverAssignmentsTab = ({ patients, caregivers }) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ patient_id: '', caregiver_id: '', start_date: '', status: 'active' });
  const [saving, setSaving] = useState(false);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await pb.collection('patient_assignments').getFullList({
        expand: 'patient_id,caregiver_id',
        $autoCancel: false,
      });
      setAssignments(res);
    } catch (e) {
      toast.error('Failed to load assignments: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleSave = async () => {
    if (!form.patient_id || !form.caregiver_id) {
      toast.error('Patient and caregiver are required');
      return;
    }
    setSaving(true);
    try {
      await pb.collection('patient_assignments').create({
        patient_id: form.patient_id,
        caregiver_id: form.caregiver_id,
        start_date: form.start_date || new Date().toISOString().split('T')[0],
        status: 'active',
      }, { $autoCancel: false });
      toast.success('Caregiver assigned to patient');
      setDialogOpen(false);
      setForm({ patient_id: '', caregiver_id: '', start_date: '', status: 'active' });
      fetchAssignments();
    } catch (e) {
      toast.error(e.message || 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this assignment?')) return;
    try {
      await pb.collection('patient_assignments').delete(id, { $autoCancel: false });
      toast.success('Assignment removed');
      fetchAssignments();
    } catch (e) {
      toast.error('Failed to remove assignment');
    }
  };

  const handleStatusToggle = async (id, current) => {
    const next = current === 'active' ? 'inactive' : 'active';
    try {
      await pb.collection('patient_assignments').update(id, { status: next }, { $autoCancel: false });
      toast.success(`Assignment set to ${next}`);
      fetchAssignments();
    } catch (e) {
      toast.error('Failed to update status');
    }
  };

  const filtered = assignments.filter(a => {
    const patient = a.expand?.patient_id;
    const caregiver = a.expand?.caregiver_id;
    const q = search.toLowerCase();
    return (
      `${patient?.first_name} ${patient?.last_name}`.toLowerCase().includes(q) ||
      (caregiver?.name || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Caregiver → Patient Assignments</h3>
          <p className="text-muted-foreground text-sm">Link a caregiver to the patients they serve.</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Assign Caregiver
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient or caregiver..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Patient</TableHead>
                <TableHead>Caregiver</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 5 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                    No assignments yet. Click "Assign Caregiver" to create one.
                  </TableCell>
                </TableRow>
              ) : filtered.map(a => (
                <TableRow key={a.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {a.expand?.patient_id?.first_name} {a.expand?.patient_id?.last_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                        <UserCheck className="h-3.5 w-3.5 text-secondary" />
                      </div>
                      {a.expand?.caregiver_id?.name || a.expand?.caregiver_id?.email || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {a.start_date ? new Date(a.start_date).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <button onClick={() => handleStatusToggle(a.id, a.status)}>
                      <Badge className={a.status === 'active'
                        ? 'bg-green-100 text-green-700 border-0 cursor-pointer hover:bg-green-200'
                        : 'bg-gray-100 text-gray-600 border-0 cursor-pointer hover:bg-gray-200'
                      }>
                        {a.status}
                      </Badge>
                    </button>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost" size="icon"
                      className="hover:text-destructive"
                      onClick={() => handleDelete(a.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Assign Caregiver to Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Patient *</Label>
              <Select value={form.patient_id} onValueChange={v => setForm(p => ({ ...p, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Caregiver *</Label>
              <Select value={form.caregiver_id} onValueChange={v => setForm(p => ({ ...p, caregiver_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select caregiver" /></SelectTrigger>
                <SelectContent>
                  {caregivers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name || c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={form.start_date}
                onChange={e => setForm(p => ({ ...p, start_date: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Family Links Tab ─────────────────────────────────────────────────────────
const FamilyLinksTab = ({ patients, familyUsers }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ patient_id: '', family_user_id: '', relationship: '' });
  const [saving, setSaving] = useState(false);

  const fetchLinks = async () => {
    setLoading(true);
    try {
      const res = await pb.collection('family_links').getFullList({
        expand: 'patient_id,family_user_id',
        $autoCancel: false,
      });
      setLinks(res);
    } catch (e) {
      toast.error('Failed to load family links: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleSave = async () => {
    if (!form.patient_id || !form.family_user_id) {
      toast.error('Patient and family member are required');
      return;
    }
    setSaving(true);
    try {
      await pb.collection('family_links').create({
        patient_id: form.patient_id,
        family_user_id: form.family_user_id,
        relationship: form.relationship,
      }, { $autoCancel: false });
      toast.success('Family member linked to patient');
      setDialogOpen(false);
      setForm({ patient_id: '', family_user_id: '', relationship: '' });
      fetchLinks();
    } catch (e) {
      toast.error(e.message || 'Failed to create link');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this family link?')) return;
    try {
      await pb.collection('family_links').delete(id, { $autoCancel: false });
      toast.success('Family link removed');
      fetchLinks();
    } catch {
      toast.error('Failed to remove link');
    }
  };

  const filtered = links.filter(l => {
    const patient = l.expand?.patient_id;
    const family = l.expand?.family_user_id;
    const q = search.toLowerCase();
    return (
      `${patient?.first_name} ${patient?.last_name}`.toLowerCase().includes(q) ||
      (family?.name || family?.email || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold text-foreground">Family → Patient Links</h3>
          <p className="text-muted-foreground text-sm">Connect family members to their loved one's record.</p>
        </div>
        <Button className="gap-2" onClick={() => setDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Link Family Member
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search patient or family member..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Patient</TableHead>
                <TableHead>Family Member</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 4 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-5 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                    No family links yet. Click "Link Family Member" to create one.
                  </TableCell>
                </TableRow>
              ) : filtered.map(l => (
                <TableRow key={l.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <Users className="h-3.5 w-3.5 text-primary" />
                      </div>
                      {l.expand?.patient_id?.first_name} {l.expand?.patient_id?.last_name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-full bg-pink-100 flex items-center justify-center shrink-0">
                        <Heart className="h-3.5 w-3.5 text-pink-500" />
                      </div>
                      {l.expand?.family_user_id?.name || l.expand?.family_user_id?.email || '—'}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground text-sm">
                    {l.relationship || '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost" size="icon"
                      className="hover:text-destructive"
                      onClick={() => handleDelete(l.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Link Family Member to Patient</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label>Patient *</Label>
              <Select value={form.patient_id} onValueChange={v => setForm(p => ({ ...p, patient_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.first_name} {p.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Family Member *</Label>
              <Select value={form.family_user_id} onValueChange={v => setForm(p => ({ ...p, family_user_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select family user" /></SelectTrigger>
                <SelectContent>
                  {familyUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Relationship</Label>
              <Select value={form.relationship} onValueChange={v => setForm(p => ({ ...p, relationship: v }))}>
                <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
                <SelectContent>
                  {['Son', 'Daughter', 'Spouse', 'Parent', 'Sibling', 'Grandchild', 'Friend', 'Legal Guardian', 'Power of Attorney', 'Other'].map(r => (
                    <SelectItem key={r} value={r.toLowerCase().replace(' ', '_')}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : 'Create Link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
const AdminAssignmentsPage = () => {
  const [patients, setPatients] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [familyUsers, setFamilyUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [pts, cgs, fam] = await Promise.all([
          pb.collection('patients').getFullList({ sort: 'first_name', $autoCancel: false }),
          pb.collection('users').getFullList({ filter: 'role = "caregiver"', sort: 'name', $autoCancel: false }),
          pb.collection('users').getFullList({ filter: 'role = "family"', sort: 'name', $autoCancel: false }),
        ]);
        setPatients(pts);
        setCaregivers(cgs);
        setFamilyUsers(fam);
      } catch (e) {
        toast.error('Failed to load users/patients: ' + e.message);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Assignments | SeniorCare Xpress Admin</title>
      </Helmet>

      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <UserCheck className="h-6 w-6 text-primary" /> Assignments
        </h2>
        <p className="text-muted-foreground mt-1">
          Assign caregivers to patients and link family members to their loved ones.
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <Tabs defaultValue="caregivers">
          <TabsList className="mb-6">
            <TabsTrigger value="caregivers" className="gap-2">
              <UserCheck className="h-4 w-4" /> Caregiver Assignments
            </TabsTrigger>
            <TabsTrigger value="family" className="gap-2">
              <Heart className="h-4 w-4" /> Family Links
            </TabsTrigger>
          </TabsList>
          <TabsContent value="caregivers">
            <CaregiverAssignmentsTab patients={patients} caregivers={caregivers} />
          </TabsContent>
          <TabsContent value="family">
            <FamilyLinksTab patients={patients} familyUsers={familyUsers} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default AdminAssignmentsPage;
