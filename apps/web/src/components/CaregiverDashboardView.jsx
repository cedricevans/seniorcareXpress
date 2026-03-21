
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, Users, Activity } from 'lucide-react';
import { toast } from 'sonner';

const CaregiverDashboardView = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ patients: 0, todayAppointments: 0, upcomingAppointments: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const today = new Date().toISOString().split('T')[0];

      const [assignmentsRes, todayAptsRes, upcomingAptsRes] = await Promise.all([
        pb.collection('patient_assignments').getList(1, 1, {
          filter: `caregiver_id="${currentUser.id}" && status="active"`,
          $autoCancel: false
        }),
        pb.collection('appointments').getList(1, 1, {
          filter: `caregiver_id="${currentUser.id}" && appointment_date >= "${today} 00:00:00" && appointment_date <= "${today} 23:59:59" && status="scheduled"`,
          $autoCancel: false
        }),
        pb.collection('appointments').getList(1, 1, {
          filter: `caregiver_id="${currentUser.id}" && appointment_date > "${today} 23:59:59" && status="scheduled"`,
          $autoCancel: false
        })
      ]);

      setStats({
        patients: assignmentsRes.totalItems,
        todayAppointments: todayAptsRes.totalItems,
        upcomingAppointments: upcomingAptsRes.totalItems
      });
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
    </div>
  );
};

export default CaregiverDashboardView;
