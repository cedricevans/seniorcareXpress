import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, User, Activity, Phone, Calendar, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_FORM = {
  first_name: '', last_name: '', date_of_birth: '',
  gender: 'male', address: '', phone: '',
  emergency_contact: '', medical_notes: '', status: 'active',
};

const AdminPatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('patients').getList(1, 100, {
        sort: 'first_name',
        $autoCancel: false,
      });
      setPatients(records.items);
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast.error(`Failed to load patients: ${error?.message || 'Check your connection and permissions'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPatients(); }, []);

  const field = (key) => (e) => setFormData(p => ({ ...p, [key]: e.target.value }));

  const handleOpenCreate = () => {
    setSelectedPatient(null);
    setFormData(EMPTY_FORM);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      first_name: patient.first_name || '',
      last_name: patient.last_name || '',
      date_of_birth: patient.date_of_birth?.split(' ')[0] || '',
      gender: patient.gender || 'male',
      address: patient.address || '',
      phone: patient.phone || '',
      emergency_contact: patient.emergency_contact || '',
      medical_notes: patient.medical_notes || '',
      status: patient.status || 'active',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name) {
      toast.error('First and last name are required');
      return;
    }
    try {
      const payload = {
        ...formData,
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        status: formData.status || 'active',
      };
      if (selectedPatient) {
        await pb.collection('patients').update(selectedPatient.id, payload, { $autoCancel: false });
        toast.success('Patient updated');
      } else {
        await pb.collection('patients').create(payload, { $autoCancel: false });
        toast.success('Patient added');
      }
      setIsDialogOpen(false);
      fetchPatients();
    } catch (error) {
      console.error('Save patient error:', error);
      toast.error(error?.message || 'Save failed');
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('patients').delete(selectedPatient.id, { $autoCancel: false });
      toast.success('Patient deleted');
      setIsDeleteDialogOpen(false);
      fetchPatients();
    } catch (error) {
      console.error('Delete patient error:', error);
      toast.error('Failed to delete patient');
    }
  };

  const filtered = patients.filter(p =>
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Patients</h2>
          <p className="text-muted-foreground">Manage patient records and assignments.</p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" /> Add Patient
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0"
          />
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Name</TableHead>
                <TableHead>Date of Birth</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Medical Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                    No patients found. Click "Add Patient" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        {patient.first_name} {patient.last_name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {patient.date_of_birth ? new Date(patient.date_of_birth).toLocaleDateString() : '—'}
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">{patient.gender || '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {patient.phone || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        patient.status === 'active' ? 'bg-green-100 text-green-800' :
                        patient.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {patient.status || 'active'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground max-w-[180px] truncate">
                        <Activity className="h-4 w-4 shrink-0" />
                        <span className="truncate">{patient.medical_notes || 'None'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(patient)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedPatient(patient); setIsDeleteDialogOpen(true); }}
                          className="hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[540px]">
          <DialogHeader>
            <DialogTitle>{selectedPatient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>First Name *</Label>
                <Input value={formData.first_name} onChange={field('first_name')} required />
              </div>
              <div className="space-y-1">
                <Label>Last Name *</Label>
                <Input value={formData.last_name} onChange={field('last_name')} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Date of Birth</Label>
                <Input type="date" value={formData.date_of_birth} onChange={field('date_of_birth')} />
              </div>
              <div className="space-y-1">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={v => setFormData(p => ({ ...p, gender: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input value={formData.address} onChange={field('address')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input value={formData.phone} onChange={field('phone')} />
              </div>
              <div className="space-y-1">
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={v => setFormData(p => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="discharged">Discharged</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label>Emergency Contact</Label>
              <Input value={formData.emergency_contact} onChange={field('emergency_contact')} />
            </div>
            <div className="space-y-1">
              <Label>Medical Notes</Label>
              <Input value={formData.medical_notes} onChange={field('medical_notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Patient</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Delete Patient</DialogTitle></DialogHeader>
          <p className="py-4">Are you sure you want to delete <strong>{selectedPatient?.first_name} {selectedPatient?.last_name}</strong>? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPatientList;
