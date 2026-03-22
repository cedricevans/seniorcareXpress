
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Clock, Activity, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import AppointmentCalendar from '@/components/AppointmentCalendar.jsx';

const PatientDashboard = () => {
  const { currentUser } = useAuth();
  const [patient, setPatient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [careUpdates, setCareUpdates] = useState([]);
  const [carePlan, setCarePlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        // Try to find patient record linked to this user via email or family_links proxy
        let linkedPatient = null;
        
        // First try to find a patient with matching email (if email was added to patients)
        // Since schema doesn't have email, we rely on family_links as a proxy for this demo
        const links = await pb.collection('family_links').getFullList({
          filter: `family_user_id="${currentUser.id}"`,
          expand: 'patient_id',
          $autoCancel: false
        });

        if (links.length > 0 && links[0].expand?.patient_id) {
          linkedPatient = links[0].expand.patient_id;
        } else {
          const patientRecords = await pb.collection('patients').getFullList({
            filter: `user_id="${currentUser.id}"`,
            $autoCancel: false
          });
          linkedPatient = patientRecords[0] || null;
        }

        if (linkedPatient) {
          setPatient(linkedPatient);

          const [aptsRes, careUpdatesRes, planRes] = await Promise.all([
            pb.collection('appointments').getFullList({
              filter: `patient_id="${linkedPatient.id}"`,
              sort: 'appointment_date',
              expand: 'caregiver_id',
              $autoCancel: false
            }),
            pb.collection('care_updates').getFullList({
              filter: `patient_id="${linkedPatient.id}"`,
              expand: 'caregiver_id',
              limit: 5,
              $autoCancel: false
            }),
            pb.collection('care_plans').getList(1, 1, {
              filter: `patient_id="${linkedPatient.id}" && status="active"`,
              expand: 'caregiver_id',
              $autoCancel: false
            })
          ]);

          setAppointments(aptsRes);
          setCareUpdates(careUpdatesRes);
          setCarePlan(planRes.items?.[0] || null);
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
          <h1 className="text-3xl font-heading font-bold text-foreground">Welcome Back, {patient.first_name}</h1>
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
              Recent Care Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {careUpdates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent care updates found.</p>
            ) : (
              <div className="space-y-4">
                {careUpdates.map((update) => (
                  <div key={update.id} className="p-4 rounded-xl border border-border bg-muted/10">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold capitalize">{update.update_type} update</h4>
                      <span className="text-xs text-muted-foreground">
                        Caregiver: {update.expand?.caregiver_id?.name || 'Staff'}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{update.notes || 'No details provided.'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-soft rounded-2xl">
        <CardHeader>
          <CardTitle className="font-heading flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-secondary" />
            Active Care Plan
          </CardTitle>
        </CardHeader>
        <CardContent>
          {carePlan ? (
            <div className="space-y-2">
              <h4 className="text-lg font-semibold">{carePlan.title}</h4>
              <p className="text-muted-foreground text-sm">{carePlan.notes || 'No additional notes provided.'}</p>
              <p className="text-xs text-muted-foreground">Assigned caregiver: {carePlan.expand?.caregiver_id?.name || carePlan.expand?.caregiver_id?.email || 'Unassigned'}</p>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No active care plan yet.</p>
          )}
        </CardContent>
      </Card>

      <div className="bg-card rounded-2xl shadow-soft border border-border p-6">
        <h3 className="text-xl font-heading font-bold mb-6">My Calendar</h3>
        <AppointmentCalendar filterPatientId={patient.id} readOnly={true} />
      </div>
    </div>
  );
};

export default PatientDashboard;
