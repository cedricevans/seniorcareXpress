
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Users, Calendar, Activity, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import pb from '@/lib/pocketbaseClient';
import AppointmentScheduler from '@/components/AppointmentScheduler.jsx';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ patients: 0, caregivers: 0, appointments: 0, encounters: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        const [patients, caregivers, appointments, encounters] = await Promise.all([
          pb.collection('patients').getList(1, 1, { $autoCancel: false }),
          pb.collection('users').getList(1, 1, { filter: 'role="caregiver"', $autoCancel: false }),
          pb.collection('appointments').getList(1, 1, { filter: `appointment_date >= "${today}"`, $autoCancel: false }),
          pb.collection('encounters').getList(1, 1, { $autoCancel: false })
        ]);
        
        setStats({
          patients: patients.totalItems,
          caregivers: caregivers.totalItems,
          appointments: appointments.totalItems,
          encounters: encounters.totalItems
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);

  const statCards = [
    { title: 'Total Patients', value: stats.patients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: 'Active Caregivers', value: stats.caregivers, icon: Activity, color: 'text-green-600', bg: 'bg-green-100' },
    { title: 'Upcoming Appointments', value: stats.appointments, icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-100' },
    { title: 'Total Encounters', value: stats.encounters, icon: TrendingUp, color: 'text-orange-600', bg: 'bg-orange-100' },
  ];

  return (
    <div className="space-y-8">
      <Helmet>
        <title>Admin Dashboard | SeniorCare Xpress</title>
      </Helmet>

      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Admin Overview</h1>
        <p className="text-muted-foreground mt-1">Manage your facility, staff, and patients.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="border-0 shadow-soft rounded-2xl">
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

      <div className="max-w-3xl">
        <AppointmentScheduler onSuccess={() => {
          // Refresh stats or calendar if needed
        }} />
      </div>
    </div>
  );
};

export default AdminDashboard;
