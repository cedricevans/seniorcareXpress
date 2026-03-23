import React from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import AppointmentCalendar from '@/components/AppointmentCalendar.jsx';

const CaregiverSchedulePage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="space-y-6">
      <Helmet>
        <title>My Schedule | SeniorCare Xpress Caregiver</title>
      </Helmet>

      <div>
        <h2 className="text-2xl font-heading font-bold text-foreground flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary" />
          My Schedule
        </h2>
        <p className="text-muted-foreground mt-1">
          View and manage your appointments with patients.
        </p>
      </div>

      <Card className="shadow-soft border-0 p-6">
        <AppointmentCalendar filterCaregiverId={currentUser.id} readOnly={false} />
      </Card>
    </div>
  );
};

export default CaregiverSchedulePage;
