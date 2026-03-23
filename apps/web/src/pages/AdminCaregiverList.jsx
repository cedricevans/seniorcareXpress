
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, HeartHandshake, Mail, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const AdminCaregiverList = () => {
  const [caregivers, setCaregivers] = useState([]);
  const [caregiverStats, setCaregiverStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  const [viewPatientsDialogOpen, setViewPatientsDialogOpen] = useState(false);
  const [caregiverPatients, setCaregiverPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: ''
  });

  const fetchCaregivers = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('users').getList(1, 50, {
        filter: 'role = "caregiver"',
        sort: 'name',
        $autoCancel: false
      });
      setCaregivers(records.items);
      
      // Fetch stats for each caregiver
      const stats = {};
      for (const caregiver of records.items) {
        try {
          // Get patient count
          const assignments = await pb.collection('patient_assignments').getFullList({
            filter: `caregiver_id = "${caregiver.id}" && status = "active"`,
            $autoCancel: false
          });
          
          // Get appointments this week
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - weekStart.getDay());
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);
          
          const appointments = await pb.collection('appointments').getFullList({
            filter: `caregiver_id = "${caregiver.id}" && appointment_date >= "${weekStart.toISOString().split('T')[0]}" && appointment_date <= "${weekEnd.toISOString().split('T')[0]}"`,
            $autoCancel: false
          });
          
          // Get recent care updates
          const recentUpdates = await pb.collection('care_updates').getList(1, 1, {
            filter: `caregiver_id = "${caregiver.id}"`,
            sort: '-created',
            $autoCancel: false
          });
          
          stats[caregiver.id] = {
            patientCount: assignments.length,
            appointmentsThisWeek: appointments.length,
            lastUpdate: recentUpdates.items[0]?.created || null
          };
        } catch (err) {
          console.error(`Failed to fetch stats for ${caregiver.name}:`, err);
          stats[caregiver.id] = { patientCount: 0, appointmentsThisWeek: 0, lastUpdate: null };
        }
      }
      setCaregiverStats(stats);
    } catch (error) {
      console.error('Failed to load caregivers:', error);
      toast.error(`Failed to load caregivers: ${error?.message || 'Check your connection and permissions'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, []);

  const handleOpenCreate = () => {
    setSelectedCaregiver(null);
    setFormData({ name: '', email: '', password: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (caregiver) => {
    setSelectedCaregiver(caregiver);
    setFormData({
      name: caregiver.name || '',
      email: caregiver.email || '',
      password: '' // Don't pre-fill password
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (caregiver) => {
    setSelectedCaregiver(caregiver);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Name and email are required');
      return;
    }
    if (!selectedCaregiver && !formData.password) {
      toast.error('Password is required for new caregivers');
      return;
    }
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: 'caregiver',
        emailVisibility: true,
      };

      if (formData.password) {
        payload.password = formData.password;
        payload.passwordConfirm = formData.password;
      }

      if (selectedCaregiver) {
        await pb.collection('users').update(selectedCaregiver.id, payload, { $autoCancel: false });
        toast.success('Caregiver updated successfully');
      } else {
        await pb.collection('users').create(payload, { $autoCancel: false });
        toast.success('Caregiver added successfully');
      }
      setIsDialogOpen(false);
      fetchCaregivers();
    } catch (error) {
      console.error('Caregiver save error:', error);
      toast.error(error?.message || (selectedCaregiver ? 'Failed to update caregiver' : 'Failed to add caregiver'));
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('users').delete(selectedCaregiver.id, { $autoCancel: false });
      toast.success('Caregiver deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchCaregivers();
    } catch (error) {
      toast.error('Failed to delete caregiver');
    }
  };

  const handleViewPatients = async (caregiver) => {
    setSelectedCaregiver(caregiver);
    setViewPatientsDialogOpen(true);
    setLoadingPatients(true);
    try {
      const assignments = await pb.collection('patient_assignments').getFullList({
        filter: `caregiver_id = "${caregiver.id}" && status = "active"`,
        expand: 'patient_id',
        $autoCancel: false
      });
      setCaregiverPatients(assignments);
    } catch (error) {
      console.error('Failed to load patients:', error);
      toast.error('Failed to load assigned patients');
    } finally {
      setLoadingPatients(false);
    }
  };

  const filteredCaregivers = caregivers.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Caregivers</h2>
          <p className="text-muted-foreground">Manage care staff and assignments.</p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <HeartHandshake className="h-4 w-4" /> Invite Caregiver
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-soft border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search caregivers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-foreground"
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Caregiver</TableHead>
                <TableHead>Patients</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead>Last Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredCaregivers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No caregivers found.</TableCell></TableRow>
              ) : (
                filteredCaregivers.map((caregiver) => {
                  const stats = caregiverStats[caregiver.id] || { patientCount: 0, appointmentsThisWeek: 0, lastUpdate: null };
                  return (
                    <TableRow key={caregiver.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                              <HeartHandshake className="h-4 w-4 text-secondary" />
                            </div>
                            <span>{caregiver.name || 'Unnamed Caregiver'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground ml-10">
                            <Mail className="h-3 w-3" />
                            {caregiver.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {stats.patientCount} {stats.patientCount === 1 ? 'patient' : 'patients'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {stats.appointmentsThisWeek} this week
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString() : 'No activity'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleViewPatients(caregiver)} className="text-muted-foreground hover:text-primary" title="View Assigned Patients">
                            <Users className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(caregiver)} className="text-muted-foreground hover:text-primary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(caregiver)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{selectedCaregiver ? 'Edit Caregiver' : 'Invite Caregiver'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{selectedCaregiver ? 'New Password (leave blank to keep current)' : 'Password *'}</Label>
              <Input id="password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!selectedCaregiver} />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Caregiver</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Caregiver</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete <strong>{selectedCaregiver?.name || selectedCaregiver?.email}</strong>? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Patients Dialog */}
      <Dialog open={viewPatientsDialogOpen} onOpenChange={setViewPatientsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Patients Assigned to {selectedCaregiver?.name || selectedCaregiver?.email}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {loadingPatients ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : caregiverPatients.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/40" />
                <p>No patients currently assigned to this caregiver.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {caregiverPatients.map((assignment) => {
                  const patient = assignment.expand?.patient_id;
                  return (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors" onClick={() => window.location.href = `/admin/patients`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-lg">{patient?.first_name} {patient?.last_name}</p>
                            <p className="text-sm text-muted-foreground">Assigned: {assignment.start_date || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="ml-13 grid grid-cols-2 gap-2 text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="font-medium">Status:</span> {patient?.status || 'active'}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <span className="font-medium">Age:</span> {patient?.date_of_birth ? Math.floor((new Date() - new Date(patient.date_of_birth)) / 31557600000) : 'N/A'}
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        {assignment.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewPatientsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCaregiverList;
