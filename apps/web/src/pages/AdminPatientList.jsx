
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Plus, User, Activity, Phone, Calendar, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminPatientList = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', dob: '', medical_conditions: '', emergency_contact: '', assigned_center_id: ''
  });

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('patients').getList(1, 50, {
        sort: '-created',
        $autoCancel: false
      });
      setPatients(records.items);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const handleOpenCreate = () => {
    setSelectedPatient(null);
    setFormData({ name: '', dob: '', medical_conditions: '', emergency_contact: '', assigned_center_id: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (patient) => {
    setSelectedPatient(patient);
    setFormData({
      name: patient.name,
      dob: patient.dob ? patient.dob.split(' ')[0] : '',
      medical_conditions: patient.medical_conditions || '',
      emergency_contact: patient.emergency_contact || '',
      assigned_center_id: patient.assigned_center_id || ''
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (patient) => {
    setSelectedPatient(patient);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        dob: `${formData.dob} 00:00:00.000Z`
      };

      if (selectedPatient) {
        await pb.collection('patients').update(selectedPatient.id, payload, { $autoCancel: false });
        toast.success('Patient updated successfully');
      } else {
        await pb.collection('patients').create(payload, { $autoCancel: false });
        toast.success('Patient added successfully');
      }
      setIsDialogOpen(false);
      fetchPatients();
    } catch (error) {
      toast.error(selectedPatient ? 'Failed to update patient' : 'Failed to add patient');
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('patients').delete(selectedPatient.id, { $autoCancel: false });
      toast.success('Patient deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchPatients();
    } catch (error) {
      toast.error('Failed to delete patient');
    }
  };

  const filteredPatients = patients.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Patients</h2>
          <p className="text-muted-foreground">Manage patient records and assignments.</p>
        </div>
        
        <Button className="gap-2" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" /> Add Patient
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-soft border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search patients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-foreground"
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Patient Name</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Medical Conditions</TableHead>
                <TableHead>Emergency Contact</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-16 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPatients.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No patients found.</TableCell></TableRow>
              ) : (
                filteredPatients.map((patient) => (
                  <TableRow key={patient.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        {patient.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {new Date(patient.dob).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground max-w-[200px] truncate">
                        <Activity className="h-4 w-4 shrink-0" />
                        <span className="truncate">{patient.medical_conditions || 'None recorded'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        {patient.emergency_contact || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(patient)} className="text-muted-foreground hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(patient)} className="text-muted-foreground hover:text-destructive">
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

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedPatient ? 'Edit Patient' : 'Add New Patient'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of Birth *</Label>
              <Input id="dob" type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medical_conditions">Medical Conditions</Label>
              <Input id="medical_conditions" value={formData.medical_conditions} onChange={e => setFormData({...formData, medical_conditions: e.target.value})} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emergency_contact">Emergency Contact</Label>
              <Input id="emergency_contact" value={formData.emergency_contact} onChange={e => setFormData({...formData, emergency_contact: e.target.value})} />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Patient</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Patient</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete <strong>{selectedPatient?.name}</strong>? This action cannot be undone.</p>
          </div>
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
