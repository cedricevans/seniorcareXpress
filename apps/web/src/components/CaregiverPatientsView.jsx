
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Activity, Phone, Calendar, HeartPulse, FileText, Utensils, Droplets, Pill, Dumbbell, Smile, BedDouble, Accessibility, AlertTriangle, NotebookPen } from 'lucide-react';
import { toast } from 'sonner';

const CaregiverPatientsView = () => {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [careUpdates, setCareUpdates] = useState([]);
  const [logForm, setLogForm] = useState({ update_type: '', notes: '' });
  const [logSaving, setLogSaving] = useState(false);
  const [checklist, setChecklist] = useState({
    recordId: null,
    date: new Date().toISOString().split('T')[0],
    tasks: {
      feeding: false,
      bathing: false,
      grooming: false,
      toileting: false,
      exercise: false,
      mobility: false,
      medication: false,
      hydration: false,
      companionship: false,
      housekeeping: false,
    },
    notes: '',
    status: 'in_progress',
  });
  const [checklistSaving, setChecklistSaving] = useState(false);

  const fetchPatients = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('patient_assignments').getList(1, 50, {
        filter: `caregiver_id="${currentUser.id}" && status="active"`,
        expand: 'patient_id',
        $autoCancel: false
      });
      
      const extractedPatients = records.items
        .map(item => item.expand?.patient_id)
        .filter(Boolean);
        
      setPatients(extractedPatients);
    } catch (err) {
      console.error("Error fetching patients:", err);
      setError("Failed to load assigned patients.");
      toast.error("Failed to load assigned patients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchPatients();
    }
  }, [currentUser]);

  const calculateAge = (dobString) => {
    if (!dobString) return 'N/A';
    const dob = new Date(dobString);
    const diff = Date.now() - dob.getTime();
    const age = new Date(diff).getUTCFullYear() - 1970;
    return age;
  };

  const updateTypes = [
    { id: 'feeding', label: 'Feeding/Meals', icon: Utensils },
    { id: 'bathing', label: 'Bathing/Hygiene', icon: Droplets },
    { id: 'grooming', label: 'Grooming', icon: Smile },
    { id: 'toileting', label: 'Toileting', icon: Accessibility },
    { id: 'exercise', label: 'Exercise', icon: Dumbbell },
    { id: 'mobility', label: 'Mobility', icon: Activity },
    { id: 'sleep', label: 'Sleep/Rest', icon: BedDouble },
    { id: 'mood', label: 'Mood/Behavior', icon: HeartPulse },
    { id: 'social_activity', label: 'Social Activity', icon: Smile },
    { id: 'medication', label: 'Medication', icon: Pill },
    { id: 'vitals', label: 'Vitals', icon: HeartPulse },
    { id: 'incident', label: 'Incident', icon: AlertTriangle },
    { id: 'general', label: 'General', icon: NotebookPen },
  ];

  const mapNoteType = (type) => {
    if (['vitals', 'medication'].includes(type)) return 'medical';
    if (['feeding', 'bathing', 'grooming', 'toileting', 'exercise', 'mobility', 'sleep', 'mood', 'social_activity', 'incident'].includes(type)) {
      return type;
    }
    return 'general';
  };

  const openPatientDetail = async (patient) => {
    setSelectedPatient(patient);
    setDetailOpen(true);
    setLogForm({ update_type: '', notes: '' });
    try {
      const updates = await pb.collection('care_updates').getList(1, 10, {
        filter: `patient_id="${patient.id}"`,
        sort: '-created',
        expand: 'caregiver_id',
        $autoCancel: false,
      });
      setCareUpdates(updates.items);
    } catch (err) {
      console.error('Error loading care updates:', err);
      setCareUpdates([]);
    }
    try {
      const today = new Date().toISOString().split('T')[0];
      const existing = await pb.collection('care_checklists').getFirstListItem(
        `patient_id=\"${patient.id}\" && date=\"${today}\"`,
        { $autoCancel: false }
      );
      setChecklist({
        recordId: existing.id,
        date: today,
        tasks: existing.tasks || checklist.tasks,
        notes: existing.notes || '',
        status: existing.status || 'in_progress',
      });
    } catch {
      const today = new Date().toISOString().split('T')[0];
      setChecklist((prev) => ({ ...prev, recordId: null, date: today }));
    }
  };

  const handleLogSubmit = async (event) => {
    event.preventDefault();
    if (!selectedPatient || !logForm.update_type || !logForm.notes) {
      toast.error('Select an activity and add notes.');
      return;
    }
    setLogSaving(true);
    try {
      await pb.collection('care_updates').create({
        patient_id: selectedPatient.id,
        caregiver_id: currentUser.id,
        update_type: logForm.update_type,
        notes: logForm.notes,
      }, { $autoCancel: false });

      await pb.collection('caregiver_notes').create({
        patient_id: selectedPatient.id,
        caregiver_id: currentUser.id,
        note: logForm.notes,
        note_type: mapNoteType(logForm.update_type),
      }, { $autoCancel: false });

      toast.success('Care update saved');
      setLogForm({ update_type: '', notes: '' });
      const updates = await pb.collection('care_updates').getList(1, 10, {
        filter: `patient_id="${selectedPatient.id}"`,
        sort: '-created',
        expand: 'caregiver_id',
        $autoCancel: false,
      });
      setCareUpdates(updates.items);
    } catch (err) {
      console.error('Error saving care update:', err);
      toast.error('Failed to save care update');
    } finally {
      setLogSaving(false);
    }
  };

  const handleChecklistToggle = (key) => {
    setChecklist((prev) => ({
      ...prev,
      tasks: { ...prev.tasks, [key]: !prev.tasks[key] },
    }));
  };

  const handleChecklistSave = async () => {
    if (!selectedPatient) return;
    setChecklistSaving(true);
    try {
      const payload = {
        patient_id: selectedPatient.id,
        caregiver_id: currentUser.id,
        date: checklist.date,
        tasks: checklist.tasks,
        notes: checklist.notes,
        status: checklist.status,
      };
      let record;
      if (checklist.recordId) {
        record = await pb.collection('care_checklists').update(checklist.recordId, payload, { $autoCancel: false });
      } else {
        record = await pb.collection('care_checklists').create(payload, { $autoCancel: false });
      }
      setChecklist((prev) => ({ ...prev, recordId: record.id }));
      toast.success('Daily checklist saved');
    } catch (err) {
      console.error('Error saving checklist:', err);
      toast.error('Failed to save checklist');
    } finally {
      setChecklistSaving(false);
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-2xl border border-destructive/20">
        <p className="text-destructive font-medium mb-4">{error}</p>
        <Button onClick={fetchPatients} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">My Patients</h2>
        <Button variant="outline" onClick={fetchPatients} disabled={loading}>Refresh</Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-0 shadow-soft rounded-2xl">
              <CardHeader className="pb-4 border-b"><Skeleton className="h-12 w-full" /></CardHeader>
              <CardContent className="pt-4 space-y-4"><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : patients.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-soft">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Active Patients</h3>
          <p className="text-muted-foreground">You don't have any patients assigned to you at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {patients.map((patient) => (
            <Card key={patient.id} className="border-0 shadow-soft rounded-2xl hover:shadow-md transition-all duration-300 flex flex-col h-full group">
              <CardHeader className="pb-4 border-b border-border/50 bg-muted/10">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <User className="h-6 w-6 text-primary group-hover:text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">{patient.first_name} {patient.last_name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {calculateAge(patient.date_of_birth)} years old
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-5 space-y-5 flex-1 flex flex-col">
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                    <Activity className="h-4 w-4 text-secondary" /> Medical Conditions
                  </div>
                  <p className="text-sm text-foreground line-clamp-2 bg-muted/30 p-2.5 rounded-lg">
                    {patient.medical_notes || 'None recorded'}
                  </p>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                    <Phone className="h-4 w-4 text-green-600" /> Emergency Contact
                  </div>
                  <p className="text-sm text-foreground font-medium">
                    {patient.emergency_contact || 'N/A'}
                  </p>
                </div>
                
                <div className="mt-auto pt-4">
                  <Button
                    className="w-full gap-2 rounded-xl"
                    variant="secondary"
                    onClick={() => openPatientDetail(patient)}
                  >
                    <HeartPulse className="h-4 w-4" /> View Full Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          {selectedPatient && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="bg-muted/20 rounded-2xl p-5">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{selectedPatient.first_name} {selectedPatient.last_name}</h3>
                      <p className="text-sm text-muted-foreground">{calculateAge(selectedPatient.date_of_birth)} years old</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div><span className="font-medium text-foreground">Phone:</span> {selectedPatient.phone || 'N/A'}</div>
                    <div><span className="font-medium text-foreground">Status:</span> {selectedPatient.status || 'active'}</div>
                    <div><span className="font-medium text-foreground">Gender:</span> {selectedPatient.gender || 'N/A'}</div>
                    <div><span className="font-medium text-foreground">Emergency:</span> {selectedPatient.emergency_contact || 'N/A'}</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <FileText className="h-5 w-5 text-secondary" /> Medical Notes
                  </h4>
                  <p className="text-sm text-muted-foreground bg-muted/20 rounded-xl p-4">
                    {selectedPatient.medical_notes || 'No medical notes on file.'}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-lg font-semibold flex items-center gap-2">
                    <HeartPulse className="h-5 w-5 text-primary" /> Recent Care Updates
                  </h4>
                  {careUpdates.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No updates yet.</p>
                  ) : (
                    <div className="space-y-3">
                      {careUpdates.map((update) => (
                        <div key={update.id} className="border border-border/60 rounded-xl p-3">
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="capitalize">{update.update_type?.replace('_', ' ') || 'general'}</Badge>
                            <span className="text-xs text-muted-foreground">{new Date(update.created).toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mt-2">{update.notes || 'No notes provided.'}</p>
                          <p className="text-xs text-muted-foreground mt-2">Logged by {update.expand?.caregiver_id?.name || 'Caregiver'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-5">
                <h4 className="text-lg font-semibold">Daily Care Checklist</h4>
                <div className="bg-muted/20 rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { key: 'feeding', label: 'Feeding/Meals' },
                      { key: 'bathing', label: 'Bathing/Hygiene' },
                      { key: 'grooming', label: 'Grooming' },
                      { key: 'toileting', label: 'Toileting' },
                      { key: 'exercise', label: 'Exercise' },
                      { key: 'mobility', label: 'Mobility' },
                      { key: 'medication', label: 'Medication' },
                      { key: 'hydration', label: 'Hydration' },
                      { key: 'companionship', label: 'Companionship' },
                      { key: 'housekeeping', label: 'Light Housekeeping' },
                    ].map((task) => (
                      <button
                        key={task.key}
                        type="button"
                        onClick={() => handleChecklistToggle(task.key)}
                        className={`w-full text-left px-3 py-2 rounded-xl border text-sm transition-colors ${
                          checklist.tasks[task.key]
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-white border-border text-muted-foreground hover:bg-muted/30'
                        }`}
                      >
                        {task.label}
                      </button>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <Label>Checklist Notes</Label>
                    <Textarea
                      value={checklist.notes}
                      onChange={(e) => setChecklist((prev) => ({ ...prev, notes: e.target.value }))}
                      rows={3}
                      className="bg-white"
                      placeholder="Add notes for today’s care..."
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Select
                      value={checklist.status}
                      onValueChange={(val) => setChecklist((prev) => ({ ...prev, status: val }))}
                    >
                      <SelectTrigger className="bg-white sm:w-48">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="flex-1" onClick={handleChecklistSave} disabled={checklistSaving}>
                      {checklistSaving ? 'Saving...' : 'Save Checklist'}
                    </Button>
                  </div>
                </div>

                <h4 className="text-lg font-semibold">Log Care Activity</h4>
                <form onSubmit={handleLogSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Activity Type *</Label>
                    <Select value={logForm.update_type} onValueChange={(val) => setLogForm((prev) => ({ ...prev, update_type: val }))}>
                      <SelectTrigger className="bg-white">
                        <SelectValue placeholder="Select activity" />
                      </SelectTrigger>
                      <SelectContent>
                        {updateTypes.map((type) => (
                          <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Notes *</Label>
                    <Textarea
                      value={logForm.notes}
                      onChange={(e) => setLogForm((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Document the care provided (meals, bath, exercise, etc.)"
                      rows={5}
                      className="bg-white"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={logSaving}>
                    {logSaving ? 'Saving...' : 'Save Care Update'}
                  </Button>
                </form>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaregiverPatientsView;
