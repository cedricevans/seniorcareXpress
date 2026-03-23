
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Users, Calendar, Activity, TrendingUp, AlertTriangle, HeartHandshake, ArrowRight, ClipboardList } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ patients: 0, caregivers: 0, appointments: 0, careUpdates: 0 });
  const [recentActivity, setRecentActivity] = useState([]);
  const [unassignedPatients, setUnassignedPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];

        const [patients, caregivers, appointments, careUpdates, recentUpdates, allPatients, assignments] = await Promise.all([
          pb.collection('patients').getList(1, 1, { $autoCancel: false }),
          pb.collection('users').getList(1, 1, { filter: 'role="caregiver"', $autoCancel: false }),
          pb.collection('appointments').getList(1, 1, { filter: `appointment_date >= "${today}"`, $autoCancel: false }),
          pb.collection('care_updates').getList(1, 1, { $autoCancel: false }),
          pb.collection('care_updates').getList(1, 8, { sort: '-created', expand: 'caregiver_id,patient_id', $autoCancel: false }),
          pb.collection('patients').getFullList({ $autoCancel: false }),
          pb.collection('patient_assignments').getFullList({ filter: 'status="active"', $autoCancel: false })
        ]);

        setStats({
          patients: patients.totalItems,
          caregivers: caregivers.totalItems,
          appointments: appointments.totalItems,
          careUpdates: careUpdates.totalItems
        });

        setRecentActivity(recentUpdates.items);

        // Find patients with no active assignment
        const assignedPatientIds = new Set(assignments.map(a => a.patient_id));
        const unassigned = allPatients.filter(p => !assignedPatientIds.has(p.id));
        setUnassignedPatients(unassigned);

      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Patients', value: stats.patients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100', link: '/admin/patients' },
    { title: 'Active Caregivers', value: stats.caregivers, icon: HeartHandshake, color: 'text-green-600', bg: 'bg-green-100', link: '/admin/caregivers' },
    { title: 'Upcoming Appointments', value: stats.appointments, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100', link: '/admin/appointments' },
    { title: 'Care Updates Logged', value: stats.careUpdates, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100', link: '/admin/care-updates' },
  ];

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Admin Dashboard | SeniorCare Xpress</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Admin Overview</h1>
          <p className="text-muted-foreground mt-1">Manage your facility, staff, and patients.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2" onClick={() => navigate('/admin/caregivers')}>
            <HeartHandshake className="h-4 w-4" /> Caregivers
          </Button>
          <Button className="gap-2" onClick={() => navigate('/admin/patients')}>
            <Users className="h-4 w-4" /> Patients
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="border-0 shadow-soft rounded-2xl hover:-translate-y-1 transition-transform duration-300 cursor-pointer" onClick={() => navigate(stat.link)}>
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${stat.bg} flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">
                  {loading ? <Skeleton className="h-8 w-12" /> : stat.value}
                </h3>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Unassigned Patients Alert */}
      {!loading && unassignedPatients.length > 0 && (
        <Card className="border-0 shadow-soft rounded-2xl border-l-4 border-l-amber-400 bg-amber-50">
          <CardContent className="p-5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900">
                  {unassignedPatients.length} patient{unassignedPatients.length > 1 ? 's' : ''} without a caregiver
                </p>
                <p className="text-sm text-amber-700">
                  {unassignedPatients.map(p => `${p.first_name} ${p.last_name}`).join(', ')}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="border-amber-400 text-amber-700 hover:bg-amber-100 shrink-0" onClick={() => navigate('/admin/patients')}>
              Assign Now <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity Feed */}
        <Card className="border-0 shadow-soft rounded-2xl">
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                Recent Activity
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-3">
                {recentActivity.map(update => (
                  <div key={update.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                      <ClipboardList className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">
                        <span className="text-primary">{update.expand?.caregiver_id?.name || 'A caregiver'}</span>
                        {' '}logged a{' '}
                        <span className="capitalize">{update.update_type}</span>
                        {' '}update
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Patient: {update.expand?.patient_id?.first_name} {update.expand?.patient_id?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(update.created).toLocaleDateString()} at {new Date(update.created).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 capitalize">{update.update_type}</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-0 shadow-soft rounded-2xl">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-3">
              {[
                { label: 'View All Patients', desc: 'See patient list with drill-down details', icon: Users, color: 'bg-blue-50 text-blue-700', link: '/admin/patients' },
                { label: 'Manage Caregivers', desc: 'View caregiver assignments and schedules', icon: HeartHandshake, color: 'bg-green-50 text-green-700', link: '/admin/caregivers' },
                { label: 'View Appointments', desc: 'See all upcoming appointments', icon: Calendar, color: 'bg-purple-50 text-purple-700', link: '/admin/appointments' },
                { label: 'Care Updates Log', desc: 'Review all logged care activity', icon: Activity, color: 'bg-orange-50 text-orange-700', link: '/admin/care-updates' },
              ].map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(action.link)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-lg ${action.color} flex items-center justify-center shrink-0`}>
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{action.label}</p>
                    <p className="text-xs text-muted-foreground">{action.desc}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;

