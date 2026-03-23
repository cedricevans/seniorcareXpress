
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Activity, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const CaregiverDashboardView = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ patients: 0, todayAppointments: 0, upcomingAppointments: 0 });
  const [todayAppointments, setTodayAppointments] = useState([]);
  const [recentUpdates, setRecentUpdates] = useState([]);
  const [myPatients, setMyPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];

      const [assignmentsRes, todayAptsRes, upcomingAptsRes, todayApptsList, recentCareUpdates] = await Promise.all([
        pb.collection('patient_assignments').getList(1, 50, {
          filter: `caregiver_id="${currentUser.id}" && status="active"`,
          expand: 'patient_id',
          $autoCancel: false
        }),
        pb.collection('appointments').getList(1, 1, {
          filter: `caregiver_id="${currentUser.id}" && appointment_date >= "${today} 00:00:00" && appointment_date <= "${today} 23:59:59" && status="scheduled"`,
          $autoCancel: false
        }),
        pb.collection('appointments').getList(1, 1, {
          filter: `caregiver_id="${currentUser.id}" && appointment_date > "${today} 23:59:59" && status="scheduled"`,
          $autoCancel: false
        }),
        pb.collection('appointments').getFullList({
          filter: `caregiver_id="${currentUser.id}" && appointment_date >= "${today} 00:00:00" && appointment_date <= "${today} 23:59:59" && status="scheduled"`,
          expand: 'patient_id',
          sort: 'appointment_time',
          $autoCancel: false
        }),
        pb.collection('care_updates').getList(1, 5, {
          filter: `caregiver_id="${currentUser.id}"`,
          sort: '-created',
          expand: 'patient_id',
          $autoCancel: false
        })
      ]);

      setStats({
        patients: assignmentsRes.totalItems,
        todayAppointments: todayAptsRes.totalItems,
        upcomingAppointments: upcomingAptsRes.totalItems
      });
      
      setMyPatients(assignmentsRes.items);
      setTodayAppointments(todayApptsList);
      setRecentUpdates(recentCareUpdates.items);
    } catch (err) {
      console.error("Error fetching dashboard stats:", err);
      setError("Failed to load dashboard summary.");
      toast.error("Failed to load dashboard summary.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchDashboardData();
    }
  }, [currentUser]);

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-2xl border border-destructive/20">
        <p className="text-destructive font-medium mb-4">{error}</p>
        <button onClick={fetchDashboardData} className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-muted transition-colors">Retry</button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-primary/5 border border-primary/10 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
            Welcome back, {currentUser?.name || 'Caregiver'}
          </h2>
          <p className="text-muted-foreground">
            Here is your schedule and patient summary for today.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-0 shadow-soft rounded-2xl hover:-translate-y-1 transition-transform duration-300">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned Patients</p>
              <h3 className="text-3xl font-bold mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : stats.patients}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft rounded-2xl hover:-translate-y-1 transition-transform duration-300">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
              <Activity className="w-7 h-7 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Today's Visits</p>
              <h3 className="text-3xl font-bold mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : stats.todayAppointments}
              </h3>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-soft rounded-2xl hover:-translate-y-1 transition-transform duration-300">
          <CardContent className="p-6 flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
              <Calendar className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
              <h3 className="text-3xl font-bold mt-1">
                {loading ? <Skeleton className="h-8 w-16" /> : stats.upcomingAppointments}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Today's Schedule */}
      <Card className="border-0 shadow-soft rounded-2xl">
        <CardHeader className="border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Today's Schedule
            </CardTitle>
            <Button variant="outline" size="sm" onClick={() => navigate('/caregiver/availability')}>
              View Calendar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : todayAppointments.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">No appointments scheduled for today</p>
          ) : (
            <div className="space-y-3">
              {todayAppointments.map((appt) => (
                <div key={appt.id} className="p-4 border rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{appt.appointment_time}</span>
                      </div>
                      <p className="text-sm font-medium">{appt.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Patient: {appt.expand?.patient_id?.first_name} {appt.expand?.patient_id?.last_name}
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {appt.duration_minutes || 60} min
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Patients Quick Access */}
        <Card className="border-0 shadow-soft rounded-2xl">
          <CardHeader className="border-b">
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                My Patients
              </CardTitle>
              <Button variant="outline" size="sm" onClick={() => navigate('/caregiver/patients')}>
                View All
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : myPatients.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No patients assigned yet</p>
            ) : (
              <div className="space-y-3">
                {myPatients.slice(0, 5).map((assignment) => {
                  const patient = assignment.expand?.patient_id;
                  return (
                    <div key={assignment.id} className="p-3 border rounded-lg hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => navigate('/caregiver/patients')}>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{patient?.first_name} {patient?.last_name}</p>
                          <p className="text-sm text-muted-foreground">Since: {assignment.start_date || 'N/A'}</p>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-0 shadow-soft rounded-2xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentUpdates.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No recent updates</p>
            ) : (
              <div className="space-y-3">
                {recentUpdates.map((update) => (
                  <div key={update.id} className="p-3 border rounded-lg">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center shrink-0">
                        <Activity className="h-4 w-4 text-secondary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium capitalize">{update.update_type}</p>
                        <p className="text-sm text-muted-foreground">
                          {update.expand?.patient_id?.first_name} {update.expand?.patient_id?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(update.created).toLocaleDateString()} at {new Date(update.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CaregiverDashboardView;
