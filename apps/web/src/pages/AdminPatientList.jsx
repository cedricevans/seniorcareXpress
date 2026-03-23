import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, User, Activity, Phone, Calendar, Edit, Trash2, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY_FORM = {
  first_name: '', last_name: '', date_of_birth: '',
  gender: 'male', address: '', phone: '',
  emergency_contact: '', medical_notes: '', status: 'active',
};

const AdminPatientList = () => {
  const [patients, setPatients] = useState([]);
  const [patientStats, setPatientStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [patientDetails, setPatientDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);

  // Assign-caregiver state
  // caregiverUsers: all users with role='caregiver' — loaded once when details dialog opens
  // selectedCaregiverId: the caregiver user ID the admin picks from the dropdown
  // assignLoading: tracks the save operation
  const [caregiverUsers, setCaregiverUsers] = useState([]);
  const [selectedCaregiverId, setSelectedCaregiverId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('patients').getList(1, 100, {
        sort: 'first_name',
        $autoCancel: false,
      });
      setPatients(records.items);
      
      // Fetch stats for each patient
      const stats = {};
      for (const patient of records.items) {
        try {
          // Get assigned caregiver
          const assignments = await pb.collection('patient_assignments').getFullList({
            filter: `patient_id = "${patient.id}" && status = "active"`,
            expand: 'caregiver_id',
            $autoCancel: false
          });
          
          // Get upcoming appointments
          const today = new Date().toISOString().split('T')[0];
          const appointments = await pb.collection('appointments').getFullList({
            filter: `patient_id = "${patient.id}" && appointment_date >= "${today}" && status = "scheduled"`,
            $autoCancel: false
          });
          
          // Get recent care updates
          const updates = await pb.collection('care_updates').getList(1, 1, {
            filter: `patient_id = "${patient.id}"`,
            sort: '-created',
            $autoCancel: false
          });
          
          stats[patient.id] = {
            caregiver: assignments[0]?.expand?.caregiver_id?.name || 'Unassigned',
            upcomingAppointments: appointments.length,
            lastUpdate: updates.items[0]?.created || null
          };
        } catch (err) {
          console.error(`Failed to fetch stats for ${patient.first_name}:`, err);
          stats[patient.id] = { caregiver: 'Unassigned', upcomingAppointments: 0, lastUpdate: null };
        }
      }
      setPatientStats(stats);
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

  const handleViewDetails = async (patient) => {
    setSelectedPatient(patient);
    setViewDetailsDialogOpen(true);
    setLoadingDetails(true);
    setPatientDetails(null);
    setSelectedCaregiverId('');
    try {
      // Load patient details AND all caregiver-role users in parallel.
      // Caregiver users are identified by role='caregiver' — we use their record ID
      // to build the patient_assignments record, never their name string.
      const [assignments, appointments, careUpdates, medicalHistory, careNotes, caregiverRes] = await Promise.all([
        pb.collection('patient_assignments').getFullList({
          filter: `patient_id = "${patient.id}"`,
          expand: 'caregiver_id',
          sort: '-created',
          $autoCancel: false
        }),
        pb.collection('appointments').getFullList({
          filter: `patient_id = "${patient.id}"`,
          sort: '-appointment_date',
          expand: 'caregiver_id',
          $autoCancel: false
        }),
        pb.collection('care_updates').getList(1, 5, {
          filter: `patient_id = "${patient.id}"`,
          sort: '-created',
          expand: 'caregiver_id',
          $autoCancel: false
        }),
        pb.collection('medical_history').getFullList({
          filter: `patient_id = "${patient.id}"`,
          $autoCancel: false
        }),
        pb.collection('caregiver_notes').getList(1, 5, {
          filter: `patient_id = "${patient.id}"`,
          sort: '-created',
          expand: 'caregiver_id',
          $autoCancel: false
        }),
        // Fetch only users whose role is exactly 'caregiver' — role is a field on the users record
        pb.collection('users').getFullList({
          filter: `role = "caregiver"`,
          sort: 'name',
          $autoCancel: false
        })
      ]);

      setCaregiverUsers(caregiverRes);

      // Pre-select the currently active caregiver in the dropdown, if any
      const activeAssignment = assignments.find(a => a.status === 'active');
      if (activeAssignment?.caregiver_id) {
        setSelectedCaregiverId(activeAssignment.caregiver_id);
      }

      setPatientDetails({
        ...patient,
        assignments,
        appointments,
        careUpdates: careUpdates.items,
        medicalHistory,
        careNotes: careNotes.items
      });
    } catch (error) {
      console.error('Failed to load patient details:', error);
      toast.error('Failed to load patient details');
    } finally {
      setLoadingDetails(false);
    }
  };

  // The core assignment handler.
  // This creates a patient_assignments record using:
  //   patient_id  = patient.id  (the patients record ID)
  //   caregiver_id = selectedCaregiverId (the users record ID, verified to have role='caregiver')
  // We never store names — only IDs. The expand on fetch resolves the names for display.
  const handleAssignCaregiver = async () => {
    if (!selectedCaregiverId || !selectedPatient) return;

    // Verify the selected user is genuinely a caregiver by checking the loaded list
    const verified = caregiverUsers.find(u => u.id === selectedCaregiverId);
    if (!verified) {
      toast.error('Selected user is not a caregiver. Please select a valid caregiver.');
      return;
    }
    if (verified.role !== 'caregiver') {
      toast.error(`Cannot assign: ${verified.name} has role '${verified.role}', not 'caregiver'.`);
      return;
    }

    setAssignLoading(true);
    try {
      // Deactivate any existing active assignments for this patient first
      const existing = await pb.collection('patient_assignments').getFullList({
        filter: `patient_id = "${selectedPatient.id}" && status = "active"`,
        $autoCancel: false
      });
      for (const old of existing) {
        await pb.collection('patient_assignments').update(old.id, { status: 'inactive' }, { $autoCancel: false });
      }

      // Check if this exact patient ↔ caregiver pair already has a record (any status)
      const existingPair = await pb.collection('patient_assignments').getList(1, 1, {
        filter: `patient_id = "${selectedPatient.id}" && caregiver_id = "${selectedCaregiverId}"`,
        $autoCancel: false
      });

      if (existingPair.items.length > 0) {
        // Re-activate the existing record
        await pb.collection('patient_assignments').update(
          existingPair.items[0].id,
          { status: 'active', start_date: new Date().toISOString().split('T')[0] },
          { $autoCancel: false }
        );
      } else {
        // Create new assignment using record IDs only — patient ID and caregiver user ID
        await pb.collection('patient_assignments').create({
          patient_id: selectedPatient.id,
          caregiver_id: selectedCaregiverId,   // users record ID, role='caregiver' verified above
          start_date: new Date().toISOString().split('T')[0],
          status: 'active',
        }, { $autoCancel: false });
      }

      toast.success(`${verified.name} assigned to ${selectedPatient.first_name} ${selectedPatient.last_name}`);
      // Refresh details panel and patient list stats
      await handleViewDetails(selectedPatient);
      fetchPatients();
    } catch (error) {
      console.error('Assign caregiver error:', error);
      toast.error(error?.message || 'Failed to assign caregiver');
    } finally {
      setAssignLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId, caregiverName) => {
    try {
      await pb.collection('patient_assignments').update(assignmentId, { status: 'inactive' }, { $autoCancel: false });
      toast.success(`Removed ${caregiverName}`);
      await handleViewDetails(selectedPatient);
      fetchPatients();
    } catch (error) {
      toast.error('Failed to remove assignment');
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
                <TableHead>Patient</TableHead>
                <TableHead>Caregiver</TableHead>
                <TableHead>Appointments</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                    No patients found. Click "Add Patient" to create one.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((patient) => {
                  const stats = patientStats[patient.id] || { caregiver: 'Unassigned', upcomingAppointments: 0, lastUpdate: null };
                  const age = patient.date_of_birth ? Math.floor((new Date() - new Date(patient.date_of_birth)) / 31557600000) : null;
                  return (
                    <TableRow key={patient.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => handleViewDetails(patient)}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                              <User className="h-4 w-4 text-primary" />
                            </div>
                            <span>{patient.first_name} {patient.last_name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground ml-10">
                            {age ? `${age} years old` : 'Age unknown'} • {patient.gender || 'Gender not specified'}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{stats.caregiver}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {stats.upcomingAppointments} upcoming
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {stats.lastUpdate ? new Date(stats.lastUpdate).toLocaleDateString() : 'No updates yet'}
                        </span>
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
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
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
                  );
                })
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

      {/* Patient Details Dialog */}
      <Dialog open={viewDetailsDialogOpen} onOpenChange={setViewDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <User className="h-6 w-6 text-primary" />
              {selectedPatient?.first_name} {selectedPatient?.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {loadingDetails ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : patientDetails ? (
              <>
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
                  <div>
                    <p className="text-sm text-muted-foreground">Age</p>
                    <p className="font-medium">
                      {patientDetails.date_of_birth ? Math.floor((new Date() - new Date(patientDetails.date_of_birth)) / 31557600000) : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gender</p>
                    <p className="font-medium capitalize">{patientDetails.gender || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{patientDetails.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="font-medium capitalize">{patientDetails.status || 'active'}</p>
                  </div>
                </div>

                {/* Assign Caregiver — connects patient record ID to caregiver user ID */}
                <div className="p-4 border-2 border-primary/20 rounded-lg bg-primary/5">
                  <h3 className="font-semibold mb-1 flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-primary" />
                    Assign Caregiver
                  </h3>
                  <p className="text-xs text-muted-foreground mb-3">
                    Select a caregiver to link to this patient. The connection is stored by user ID — not by name or role label.
                  </p>
                  <div className="flex gap-2 items-center">
                    <Select
                      value={selectedCaregiverId}
                      onValueChange={setSelectedCaregiverId}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder={
                          caregiverUsers.length === 0
                            ? 'No caregiver accounts found'
                            : 'Select caregiver…'
                        } />
                      </SelectTrigger>
                      <SelectContent>
                        {caregiverUsers.map(u => (
                          // Each item shows: Name — email  (role confirmed = 'caregiver')
                          // The VALUE is u.id — the actual users record ID stored in patient_assignments
                          <SelectItem key={u.id} value={u.id}>
                            <span className="font-medium">{u.name}</span>
                            <span className="text-muted-foreground ml-2 text-xs">{u.email}</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAssignCaregiver}
                      disabled={!selectedCaregiverId || assignLoading}
                      size="sm"
                    >
                      {assignLoading ? 'Saving…' : 'Assign'}
                    </Button>
                  </div>
                </div>

                {/* Current Assignments */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Current Assignments
                  </h3>
                  {patientDetails.assignments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No caregivers assigned yet</p>
                  ) : (
                    <div className="space-y-2">
                      {patientDetails.assignments.map((assignment) => {
                        const cgUser = assignment.expand?.caregiver_id;
                        return (
                          <div key={assignment.id} className="p-3 border rounded-lg flex justify-between items-center">
                            <div>
                              {/* Show name for readability but the actual link is by ID */}
                              <p className="font-medium">{cgUser?.name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">
                                ID: {assignment.caregiver_id} • Since: {assignment.start_date || 'N/A'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs ${assignment.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                {assignment.status}
                              </span>
                              {assignment.status === 'active' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 hover:text-destructive"
                                  title="Remove assignment"
                                  onClick={() => handleRemoveAssignment(assignment.id, cgUser?.name || 'caregiver')}
                                >
                                  <UserX className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Appointments */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Recent Appointments
                  </h3>
                  {patientDetails.appointments.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No appointments scheduled</p>
                  ) : (
                    <div className="space-y-2">
                      {patientDetails.appointments.slice(0, 5).map((appt) => (
                        <div key={appt.id} className="p-3 border rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{appt.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {appt.appointment_date} at {appt.appointment_time}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              appt.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                              appt.status === 'completed' ? 'bg-green-100 text-green-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {appt.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Medical History */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Medical History
                  </h3>
                  {patientDetails.medicalHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No medical history recorded</p>
                  ) : (
                    <div className="space-y-2">
                      {patientDetails.medicalHistory.map((history) => (
                        <div key={history.id} className="p-3 border rounded-lg">
                          <p className="font-medium">{history.condition}</p>
                          <p className="text-sm text-muted-foreground">{history.notes || 'No notes'}</p>
                          <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${
                            history.status === 'active' ? 'bg-red-100 text-red-800' :
                            history.status === 'chronic' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {history.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Recent Care Notes */}
                <div>
                  <h3 className="font-semibold mb-3">Recent Care Notes</h3>
                  {patientDetails.careNotes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No care notes yet</p>
                  ) : (
                    <div className="space-y-2">
                      {patientDetails.careNotes.map((note) => (
                        <div key={note.id} className="p-3 border rounded-lg">
                          <p className="text-sm">{note.note}</p>
                          <p className="text-xs text-muted-foreground mt-2">
                            By: {note.expand?.caregiver_id?.name || 'Unknown'} • {new Date(note.created).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">Failed to load patient details</p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setViewDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPatientList;
