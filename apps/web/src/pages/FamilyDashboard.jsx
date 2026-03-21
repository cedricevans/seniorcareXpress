
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Heart, Activity, Calendar, FileText, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import AppointmentCalendar from '@/components/AppointmentCalendar.jsx';

const FamilyDashboard = () => {
  const { currentUser } = useAuth();
  const [patient, setPatient] = useState(null);
  const [careLogs, setCareLogs] = useState([]);
  const [medicalHistory, setMedicalHistory] = useState([]);
  const [appointments, setAppointments] = useState([]);
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
          const [logsRes, historyRes, aptsRes] = await Promise.all([
            pb.collection('care_updates').getFullList({
              filter: `patient_id="${linkedPatient.id}"`,
              sort: '-time_logged',
              expand: 'caregiver_id',
              limit: 10,
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
            })
          ]);

          setCareLogs(logsRes);
          setMedicalHistory(historyRes);
          setAppointments(aptsRes);
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
      </div>

      <Card className="border-0 shadow-soft rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
        <CardContent className="p-6 flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center shrink-0 backdrop-blur-sm border-2 border-white/30">
            <Heart className="w-10 h-10 text-white" />
          </div>
          <div>
            <p className="text-primary-foreground/80 font-medium mb-1">Caring for</p>
            <h2 className="text-2xl font-bold">{patient.name}</h2>
            <p className="text-sm mt-2 bg-white/20 inline-block px-3 py-1 rounded-full backdrop-blur-sm">
              DOB: {new Date(patient.dob).toLocaleDateString()}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-0 shadow-soft rounded-2xl h-full">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <Activity className="h-5 w-5 text-secondary" />
              Latest Care Updates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {careLogs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No recent care updates.</p>
            ) : (
              <div className="relative border-l-2 border-muted ml-4 space-y-8 pb-4">
                {careLogs.map((log) => (
                  <div key={log.id} className="relative pl-6">
                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-primary ring-4 ring-background" />
                    <p className="text-sm text-muted-foreground mb-1">
                      {new Date(log.time_logged).toLocaleString()}
                    </p>
                    <h4 className="font-bold text-foreground mb-2 capitalize">{log.update_type}</h4>
                    <p className="text-muted-foreground text-sm mb-2">{log.description}</p>
                    <p className="text-xs font-medium text-primary">
                      Logged by {log.expand?.caregiver_id?.name || log.expand?.caregiver_id?.email || 'Caregiver'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft rounded-2xl h-full">
          <CardHeader>
            <CardTitle className="font-heading flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Medical Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {medicalHistory.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No medical history recorded.</p>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {medicalHistory.map((item) => (
                  <div key={item.id} className="p-4 rounded-xl border border-border bg-muted/30">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg">{item.condition_name}</h4>
                      <span className={`text-xs px-2 py-1 rounded-full ${item.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                        {item.status}
                      </span>
                    </div>
                    {item.diagnosis_date && (
                      <p className="text-sm text-muted-foreground mb-2">Diagnosed: {new Date(item.diagnosis_date).toLocaleDateString()}</p>
                    )}
                    {item.notes && <p className="text-sm">{item.notes}</p>}
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
            <Calendar className="h-5 w-5 text-purple-500" />
            Upcoming Appointments
          </CardTitle>
        </CardHeader>
        <CardContent>
          {appointments.filter(a => a.status === 'scheduled').length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No upcoming appointments.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {appointments.filter(a => a.status === 'scheduled').map((apt) => (
                <div key={apt.id} className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/10">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-bold">{new Date(apt.appointment_date).toLocaleDateString()} at {apt.appointment_time}</h4>
                    <p className="text-sm text-muted-foreground">Caregiver: {apt.expand?.caregiver_id?.name || 'Assigned Staff'}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-card rounded-2xl shadow-soft border border-border p-6">
        <h3 className="text-xl font-heading font-bold mb-6">Care Calendar</h3>
        <AppointmentCalendar filterPatientId={patient.id} readOnly={true} />
      </div>
    </div>
  );
};

export default FamilyDashboard;
