
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Heart, Activity, Calendar, FileText, Clock, ClipboardList, MessageCircle, Phone, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import AppointmentCalendar from '@/components/AppointmentCalendar.jsx';
import { useNavigate } from 'react-router-dom';

const FamilyDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [caregiver, setCaregiver] = useState(null);
  const [careLogs, setCareLogs] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [carePlan, setCarePlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFamilyData = async () => {
      try {
        // 1. Get linked patient
        const links = await pb.collection('family_links').getFullList({
          filter: `family_user_id="${currentUser.id}"`,
          expand: 'patient_id',
          $autoCancel: false
        });

        if (links.length > 0 && links[0].expand?.patient_id) {
          const linkedPatient = links[0].expand.patient_id;
          setPatient(linkedPatient);

          // 2. Fetch related data in parallel
          const [logsRes, historyRes, aptsRes, planRes, assignmentsRes] = await Promise.all([
            pb.collection('care_updates').getFullList({
              filter: `patient_id="${linkedPatient.id}"`,
              expand: 'caregiver_id',
              sort: '-created',
              $autoCancel: false
            }),
            pb.collection('medical_history').getFullList({
              filter: `patient_id="${linkedPatient.id}"`,
              $autoCancel: false
            }),
            pb.collection('appointments').getFullList({
              filter: `patient_id="${linkedPatient.id}"`,
              sort: 'appointment_date',
              expand: 'caregiver_id',
              $autoCancel: false
            }),
            pb.collection('care_plans').getList(1, 1, {
              filter: `patient_id="${linkedPatient.id}" && status="active"`,
              expand: 'caregiver_id',
              $autoCancel: false
            }),
            pb.collection('patient_assignments').getFullList({
              filter: `patient_id="${linkedPatient.id}" && status="active"`,
              expand: 'caregiver_id',
              $autoCancel: false
            })
          ]);

          setCareLogs(logsRes);
          setMedicalHistory(historyRes);
          setAppointments(aptsRes);
          setCarePlan(planRes.items?.[0] || null);
          if (assignmentsRes.length > 0) {
            setCaregiver(assignmentsRes[0].expand?.caregiver_id || null);
          }
        }
      } catch (error) {
        console.error("Error fetching family data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchFamilyData();
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
        <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold">No Patient Linked</h2>
        <p className="text-muted-foreground mt-2">Your account is not currently linked to any patient records.</p>
      </div>
    );
  }

  const upcomingApts = appointments.filter(a => a.status === 'scheduled');
  const nextApt = upcomingApts[0];

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Family Portal | SeniorCare Xpress</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Family Portal</h1>
          <p className="text-muted-foreground mt-1">Stay connected with your loved one's care.</p>
        </div>
        {caregiver && (
          <Button className="gap-2" onClick={() => navigate('/family/messages')}>
            <MessageCircle className="h-4 w-4" /> Message Caregiver
          </Button>
        )}
      </div>

      {/* Patient Status Banner */}
      <Card className="border-0 shadow-soft rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm border-2 border-white/30">
              <Heart className="w-10 h-10 text-white" />
            </div>
            <div>
              <p className="text-primary-foreground/80 font-medium mb-1">Caring for</p>
              <h2 className="text-2xl font-bold">{patient.first_name} {patient.last_name}</h2>
              <div className="flex items-center gap-2 mt-2">
                <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {patient.status || 'Active'}
                </Badge>
                {patient.date_of_birth && (
                  <span className="text-sm bg-white/20 px-3 py-1 rounded-full">
                    Age {Math.floor((new Date() - new Date(patient.date_of_birth)) / 31557600000)}
                  </span>
                )}
              </div>
            </div>
          </div>
          {caregiver && (
            <div className="text-right sm:text-left bg-white/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="text-primary-foreground/70 text-sm mb-1">Assigned Caregiver</p>
              <p className="font-bold text-lg">{caregiver.name}</p>
              <p className="text-primary-foreground/70 text-sm">{caregiver.email}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-soft rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{upcomingApts.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Upcoming Visits</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{careLogs.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Care Updates</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-blue-600">{medicalHistory.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Medical Records</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-soft rounded-2xl">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-purple-600">{carePlan ? 1 : 0}</p>
            <p className="text-sm text-muted-foreground mt-1">Active Care Plan</p>
          </CardContent>
        </Card>
      </div>

      {/* Next Appointment */}
      {nextApt && (
        <Card className="border-0 shadow-soft rounded-2xl border-l-4 border-l-primary">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Next Scheduled Visit</p>
                <p className="font-bold text-lg">{new Date(nextApt.appointment_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                <p className="text-sm text-muted-foreground">at {nextApt.appointment_time} with {nextApt.expand?.caregiver_id?.name || 'Caregiver'}</p>
              </div>
            </div>
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Scheduled</Badge>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Latest Care Updates */}
        <Card className="border-0 shadow-soft rounded-2xl h-full">
          <CardHeader className="border-b">
            <CardTitle className="font-heading flex items-center gap-2">
              <Activity className="h-5 w-5 text-secondary" />
              Latest Care Updates
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {careLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent care updates.</p>
            ) : (
              <div className="space-y-4 max-h-80 overflow-y-auto">
                {careLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-4 rounded-xl border border-border bg-muted/10">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-semibold capitalize">{log.update_type}</h4>
                      <span className="text-xs text-muted-foreground">{new Date(log.created).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{log.notes || 'No details provided.'}</p>
                    <p className="text-xs text-primary mt-2">By {log.expand?.caregiver_id?.name || 'Caregiver'}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Medical Conditions */}
        <Card className="border-0 shadow-soft rounded-2xl h-full">
          <CardHeader className="border-b">
            <CardTitle className="font-heading flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Medical Conditions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {medicalHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No medical history recorded.</p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto">
                {medicalHistory.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold">{item.condition}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {item.status}
                      </span>
                    </div>
                    {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
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
            Active Care Plan
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
                <Badge variant="outline" className="mt-2 bg-green-50 text-green-700 border-green-200">Active</Badge>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-6">No active care plan yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Appointments */}
      <Card className="border-0 shadow-soft rounded-2xl">
        <CardHeader className="border-b">
          <CardTitle className="font-heading flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-500" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {upcomingApts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming appointments.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingApts.map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/10">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold">{new Date(apt.appointment_date).toLocaleDateString()}</h4>
                    <p className="text-sm text-muted-foreground">at {apt.appointment_time}</p>
                    <p className="text-xs text-primary">{apt.expand?.caregiver_id?.name || 'Assigned Staff'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Care Calendar */}
      <div className="bg-card rounded-2xl shadow-soft border border-border p-6">
        <h3 className="text-xl font-heading font-bold mb-6">Care Calendar</h3>
        <AppointmentCalendar filterPatientId={patient.id} readOnly={true} />
      </div>
    </div>
  );
};

export default FamilyDashboard;
