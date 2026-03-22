
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import AppointmentCalendar from '@/components/AppointmentCalendar.jsx';

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [encounters, setEncounters] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        let linkedPatient = null;

        // Strategy 1: patient role — find patient record by user_id field
        try {
          const directRecords = await pb.collection('patients').getList(1, 1, {
            filter: `user_id="${currentUser.id}"`,
            $autoCancel: false
          });
          if (directRecords.items.length > 0) {
            linkedPatient = directRecords.items[0];
          }
        } catch (e) {
          // user_id field may not exist in older schemas
        }

        // Strategy 2: family role — find patient via family_links
        if (!linkedPatient) {
          const links = await pb.collection('family_links').getFullList({
            filter: `family_user_id="${currentUser.id}"`,
            expand: 'patient_id',
            $autoCancel: false
          });
          if (links.length > 0 && links[0].expand?.patient_id) {
            linkedPatient = links[0].expand.patient_id;
          }
        }

        if (linkedPatient) {
          setPatient(linkedPatient);

          const [aptsRes, encountersRes] = await Promise.all([
            pb.collection('appointments').getFullList({
              filter: `patient_id="${linkedPatient.id}"`,
              sort: 'appointment_date',
              expand: 'caregiver_id',
              $autoCancel: false
            }),
            pb.collection('encounters').getFullList({
              filter: `patient_id="${linkedPatient.id}"`,
              sort: '-encounter_date',
              expand: 'caregiver_id',
              limit: 5,
              $autoCancel: false
            })
          ]);

          setAppointments(aptsRes);
          setEncounters(encountersRes);
        }
      } catch (error) {
        console.error("Error fetching patient data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchPatientData();
    }
  }, [currentUser]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">Profile Not Found</h2>
        <p className="text-muted-foreground mt-2">We couldn't locate your patient profile.</p>
      </div>
    );
  }

  const upcomingApts = appointments.filter(a => a.status === 'scheduled');

  return (
    <div className="space-y-8">
      <Helmet>
        <title>My Portal | SeniorCare Xpress</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Welcome Back, {patient.name.split(' ')[0]}</h1>
          <p className="text-muted-foreground mt-1">Access your appointments and records easily.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-soft rounded-2xl h-full">
          <CardHeader>
            <CardTitle className="font-heading">Next Upcoming Visit</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingApts.length > 0 ? (
              <div className="bg-muted/30 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border border-border">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-medium uppercase">
                      {new Date(upcomingApts[0].appointment_date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-lg font-bold leading-none">
                      {new Date(upcomingApts[0].appointment_date).getDate()}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">Care Visit</h4>
                    <p className="text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-4 h-4" /> {upcomingApts[0].appointment_time} with {upcomingApts[0].expand?.caregiver_id?.name || 'Caregiver'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-4">You have no upcoming visits scheduled.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft rounded-2xl h-full">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Encounters
            </CardTitle>
          </CardHeader>
          <CardContent>
            {encounters.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent encounters found.</p>
            ) : (
              <div className="space-y-4">
                {encounters.map((enc) => (
                  <div key={enc.id} className="p-4 rounded-xl border border-border bg-muted/10">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold">Visit on {new Date(enc.encounter_date).toLocaleDateString()}</h4>
                      <span className="text-xs text-muted-foreground">
                        Caregiver: {enc.expand?.caregiver_id?.name || 'Staff'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{enc.visit_notes}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="bg-card rounded-2xl shadow-soft border border-border p-6">
        <h3 className="text-xl font-heading font-bold mb-6">My Calendar</h3>
        <AppointmentCalendar filterPatientId={patient.id} readOnly={true} />
      </div>
    </div>
  );
};

export default PatientDashboard;
