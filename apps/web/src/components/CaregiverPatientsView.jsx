
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { User, Activity, Phone, Calendar, HeartPulse } from 'lucide-react';
import { toast } from 'sonner';

const CaregiverPatientsView = () => {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
                    <CardTitle className="text-xl">{patient.name}</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                      <Calendar className="h-3.5 w-3.5" />
                      {calculateAge(patient.dob)} years old
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
                    {patient.medical_conditions || 'None recorded'}
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
                  <Button className="w-full gap-2 rounded-xl" variant="secondary">
                    <HeartPulse className="h-4 w-4" /> View Full Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaregiverPatientsView;
