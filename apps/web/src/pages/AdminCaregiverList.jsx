
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
  
  const [patientDetailsDialogOpen, setPatientDetailsDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingPatientDetails, setLoadingPatientDetails] = useState(false);
  
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

  const handleViewPatientDetails = async (patient) => {
    setSelectedPatient(patient);
    setPatientDetailsDialogOpen(true);
    setLoadingPatientDetails(true);
    try {
      const [assignments, appointments, medicalHistory, careNotes] = await Promise.all([
        pb.collection('patient_assignments').getFullList({
          filter: `patient_id = "${patient.id}"`,
          expand: 'caregiver_id',
          $autoCancel: false
        }),
        pb.collection('appointments').getList(1, 10, {
          filter: `patient_id = "${patient.id}"`,
          sort: '-appointment_date',
          expand: 'caregiver_id',
          $autoCancel: false
        }),
        pb.collection('medical_history').getFullList({
          filter: `patient_id = "${patient.id}"`,
          sort: '-date',
          $autoCancel: false
        }),
        pb.collection('caregiver_notes').getList(1, 5, {
          filter: `patient_id = "${patient.id}"`,
          sort: '-created',
          expand: 'caregiver_id',
          $autoCancel: false
        })
      ]);

      setPatientDetails({
        assignments: assignments,
        appointments: appointments.items,
        medicalHistory: medicalHistory,
        careNotes: careNotes.items
      });
    } catch (error) {
      console.error('Failed to load patient details:', error);
      toast.error('Failed to load patient details');
    } finally {
      setLoadingPatientDetails(false);
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
                    <div 
                      key={assignment.id} 
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/30 cursor-pointer transition-colors" 
                      onClick={() => handleViewPatientDetails(patient)}
                    >
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

      {/* Patient Details Dialog */}
      <Dialog open={patientDetailsDialogOpen} onOpenChange={setPatientDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPatient?.first_name} {selectedPatient?.last_name} - Patient Details
            </DialogTitle>
          </DialogHeader>
          {loadingPatientDetails ? (
            <div className="space-y-4 py-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : patientDetails ? (
            <div className="space-y-6 py-4">
              {/* Basic Info */}
              <div className="bg-muted/30 rounded-lg p-4">
                <h4 className="font-semibold mb-3 text-foreground">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Age:</span>{' '}
                    <span className="font-medium">
                      {selectedPatient?.date_of_birth 
                        ? Math.floor((new Date() - new Date(selectedPatient.date_of_birth)) / 31557600000) 
                        : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Gender:</span>{' '}
                    <span className="font-medium">{selectedPatient?.gender || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>{' '}
                    <Badge variant="outline" className="ml-2">{selectedPatient?.status || 'active'}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Contact:</span>{' '}
                    <span className="font-medium">{selectedPatient?.phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Assigned Caregivers */}
              <div>
                <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assigned Caregivers ({patientDetails.assignments?.length || 0})
                </h4>
                {patientDetails.assignments?.length > 0 ? (
                  <div className="space-y-2">
                    {patientDetails.assignments.map(assignment => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <HeartHandshake className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{assignment.expand?.caregiver_id?.name || 'Unknown'}</p>
                            <p className="text-xs text-muted-foreground">Since {assignment.start_date || 'N/A'}</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{assignment.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No caregivers assigned yet.</p>
                )}
              </div>

              {/* Recent Appointments */}
              <div>
                <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Recent Appointments ({patientDetails.appointments?.length || 0})
                </h4>
                {patientDetails.appointments?.length > 0 ? (
                  <div className="space-y-2">
                    {patientDetails.appointments.map(apt => (
                      <div key={apt.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-sm">{apt.appointment_date}</p>
                            <p className="text-xs text-muted-foreground">
                              {apt.appointment_time} - {apt.expand?.caregiver_id?.name || 'N/A'}
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">{apt.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No appointments scheduled.</p>
                )}
              </div>

              {/* Medical History */}
              <div>
                <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Medical History ({patientDetails.medicalHistory?.length || 0})
                </h4>
                {patientDetails.medicalHistory?.length > 0 ? (
                  <div className="space-y-2">
                    {patientDetails.medicalHistory.map(record => (
                      <div key={record.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-sm">{record.condition || 'Medical Record'}</p>
                          <span className="text-xs text-muted-foreground">{record.date}</span>
                        </div>
                        {record.notes && (
                          <p className="text-sm text-muted-foreground">{record.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No medical history recorded.</p>
                )}
              </div>

              {/* Recent Care Notes */}
              <div>
                <h4 className="font-semibold mb-3 text-foreground flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  Recent Care Notes ({patientDetails.careNotes?.length || 0})
                </h4>
                {patientDetails.careNotes?.length > 0 ? (
                  <div className="space-y-2">
                    {patientDetails.careNotes.map(note => (
                      <div key={note.id} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-start justify-between mb-1">
                          <p className="font-medium text-sm">{note.expand?.caregiver_id?.name || 'Caregiver'}</p>
                          <span className="text-xs text-muted-foreground">
                            {new Date(note.created).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{note.note_text}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No care notes yet.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">Failed to load patient details.</p>
          )}
          <DialogFooter>
            <Button onClick={() => setPatientDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCaregiverList;
