
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Activity, Phone, Calendar, FileText } from 'lucide-react';
import { toast } from 'sonner';
import CaregiverCareNotesForm from '@/components/CaregiverCareNotesForm.jsx';

const CaregiverPatientList = () => {
  const { currentUser } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [activeDialog, setActiveDialog] = useState(null); // 'note'
  const [selectedPatient, setSelectedPatient] = useState(null);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('patient_assignments').getList(1, 50, {
        filter: `caregiver_id = "${currentUser.id}" && status = "active"`,
        expand: 'patient_id',
        $autoCancel: false
      });
      setAssignments(records.items);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load assigned patients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [currentUser.id]);

  const handleOpenDialog = (type, patient) => {
    setSelectedPatient(patient);
    setActiveDialog(type);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground">My Patients</h2>
        <p className="text-muted-foreground">Patients currently assigned to your care.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="shadow-soft border-0">
              <CardHeader className="pb-4 border-b"><Skeleton className="h-12 w-full" /></CardHeader>
              <CardContent className="pt-4 space-y-4"><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : assignments.length === 0 ? (
        <div className="bg-white rounded-xl border p-12 text-center shadow-soft">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Active Assignments</h3>
          <p className="text-muted-foreground">You don't have any patients assigned to you at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map((assignment) => {
            const patient = assignment.expand?.patient_id;
            if (!patient) return null;
            
            return (
              <Card key={assignment.id} className="shadow-soft border-0 hover:shadow-md transition-shadow flex flex-col h-full">
                <CardHeader className="pb-4 border-b">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                      <User className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{patient.name}</CardTitle>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <Calendar className="h-3 w-3" />
                        DOB: {new Date(patient.dob).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4 flex-1 flex flex-col">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Activity className="h-4 w-4" /> Medical Conditions
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                      {patient.medical_conditions || 'None recorded'}
                    </p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                      <Phone className="h-4 w-4" /> Emergency Contact
                    </div>
                    <p className="text-sm text-foreground">
                      {patient.emergency_contact || 'N/A'}
                    </p>
                  </div>
                  
                  <div className="mt-auto pt-4">
                    <Button 
                      className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground gap-2 text-xs"
                      onClick={() => handleOpenDialog('note', patient)}
                    >
                      <FileText className="h-3 w-3" /> Add Note
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dialogs for Forms */}
      <Dialog open={!!activeDialog} onOpenChange={(open) => !open && setActiveDialog(null)}>
        <DialogContent className="sm:max-w-[600px] p-0 border-0 bg-transparent shadow-none">
          {activeDialog === 'note' && selectedPatient && (
            <CaregiverCareNotesForm 
              patients={[selectedPatient]} 
              onSuccess={() => setActiveDialog(null)} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaregiverPatientList;
