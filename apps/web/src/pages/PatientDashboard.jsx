
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Clock, Activity, ClipboardList, Calendar, Heart, User, FileText, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  const nextApt = upcomingApts[0];
  const today = new Date().toISOString().split('T')[0];
  const todayApts = appointments.filter(a => a.appointment_date?.startsWith(today));

  return (
    <div className="space-y-8">
      <Helmet>
        <title>My Portal | SeniorCare Xpress</title>
      </Helmet>

      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <User className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-heading font-bold">Welcome, {patient.first_name}</h1>
            <p className="text-primary-foreground/80 mt-1">Here's your care summary for today.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <div className="bg-white/10 rounded-xl px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold">{upcomingApts.length}</p>
            <p className="text-xs text-primary-foreground/70">Upcoming Visits</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold">{todayApts.length}</p>
            <p className="text-xs text-primary-foreground/70">Today</p>
          </div>
          <div className="bg-white/10 rounded-xl px-4 py-3 text-center backdrop-blur-sm">
            <p className="text-2xl font-bold">{careUpdates.length}</p>
            <p className="text-xs text-primary-foreground/70">Care Notes</p>
          </div>
        </div>
      </div>

      {/* Today's Schedule */}
      <Card className="border-0 shadow-soft rounded-2xl">
        <CardHeader className="border-b">
          <CardTitle className="font-heading flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Today's Schedule
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {todayApts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-3 text-green-400" />
              <p>No visits scheduled for today</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayApts.map(apt => (
                <div key={apt.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-muted/10">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Clock className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{apt.appointment_time} — Care Visit</p>
                      <p className="text-sm text-muted-foreground">with {apt.expand?.caregiver_id?.name || 'Your Caregiver'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">{apt.duration_minutes || 60} min</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Next Upcoming Visit */}
        <Card className="border-0 shadow-soft rounded-2xl">
          <CardHeader className="border-b">
            <CardTitle className="font-heading flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-500" />
              Next Upcoming Visit
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {nextApt ? (
              <div className="bg-muted/30 rounded-xl p-5 flex items-center gap-5 border border-border">
                <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex flex-col items-center justify-center shrink-0">
                  <span className="text-xs font-medium uppercase">
                    {new Date(nextApt.appointment_date).toLocaleString('default', { month: 'short' })}
                  </span>
                  <span className="text-xl font-bold leading-none">
                    {new Date(nextApt.appointment_date).getDate()}
                  </span>
                </div>
                <div>
                  <h4 className="font-bold text-lg">Care Visit</h4>
                  <p className="text-muted-foreground flex items-center gap-1 mt-1">
                    <Clock className="w-4 h-4" /> {nextApt.appointment_time}
                  </p>
                  <p className="text-sm text-primary mt-1">with {nextApt.expand?.caregiver_id?.name || 'Caregiver'}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground py-4 text-center">No upcoming visits scheduled.</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Care Notes */}
        <Card className="border-0 shadow-soft rounded-2xl">
          <CardHeader className="border-b">
            <CardTitle className="font-heading flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Care Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {careUpdates.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent care updates found.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {careUpdates.map((update) => (
                  <div key={update.id} className="p-4 rounded-xl border border-border bg-muted/10">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold capitalize">{update.update_type}</h4>
                      <span className="text-xs text-muted-foreground">{new Date(update.created).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-foreground">{update.notes || 'No details provided.'}</p>
                    <p className="text-xs text-primary mt-1">by {update.expand?.caregiver_id?.name || 'Staff'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Active Care Plan */}
      <Card className="border-0 shadow-soft rounded-2xl">
        <CardHeader className="border-b">
          <CardTitle className="font-heading flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-secondary" />
            My Care Plan
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {carePlan ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <h4 className="text-lg font-semibold mb-2">{carePlan.title}</h4>
                <p className="text-muted-foreground text-sm">{carePlan.notes || 'No additional notes provided.'}</p>
              </div>
              <div className="bg-muted/30 rounded-xl p-4">
                <p className="text-sm text-muted-foreground mb-1">Assigned Caregiver</p>
                <p className="font-semibold">{carePlan.expand?.caregiver_id?.name || 'Unassigned'}</p>
                <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">Active Plan</Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No active care plan yet.</p>
          )}
        </CardContent>
      </Card>

      {/* My Calendar */}
      <div className="bg-card rounded-2xl shadow-soft border border-border p-6">
        <h3 className="text-xl font-heading font-bold mb-6">My Calendar</h3>
        <AppointmentCalendar filterPatientId={patient.id} readOnly={true} />
      </div>
    </div>
  );
};

export default PatientDashboard;

