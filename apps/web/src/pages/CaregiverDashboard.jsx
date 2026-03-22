
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import CaregiverLayout from '@/components/CaregiverLayout.jsx';
import CaregiverDashboardView from '@/components/CaregiverDashboardView.jsx';
import CaregiverPatientsView from '@/components/CaregiverPatientsView.jsx';
import CaregiverAppointmentsView from '@/components/CaregiverAppointmentsView.jsx';
import CaregiverAvailabilityView from '@/components/CaregiverAvailabilityView.jsx';

const CaregiverDashboard = () => {
  const location = useLocation();
  
  // Initialize state based on URL path to support direct navigation
  const [currentView, setCurrentView] = useState(() => {
    const path = location.pathname;
    if (path.includes('patients')) return 'patients';
    if (path.includes('appointments')) return 'appointments';
    if (path.includes('availability')) return 'availability';
    return 'dashboard';
  });

  // Sync state if URL changes externally (e.g., back button)
  useEffect(() => {
    const path = location.pathname;
    if (path.includes('patients')) setCurrentView('patients');
    else if (path.includes('appointments')) setCurrentView('appointments');
    else if (path.includes('availability')) setCurrentView('availability');
    else setCurrentView('dashboard');
  }, [location.pathname]);

  const renderView = () => {
    switch(currentView) {
      case 'patients': 
        return <CaregiverPatientsView />;
      case 'appointments': 
        return <CaregiverAppointmentsView />;
      case 'availability': 
        return <CaregiverAvailabilityView />;
      case 'dashboard':
      default:
        return <CaregiverDashboardView onNavigate={setCurrentView} />;
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <Helmet>
        <title>Caregiver Portal | SeniorCare Xpress</title>
      </Helmet>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Caregiver Portal</h1>
          <p className="text-muted-foreground mt-1">Manage your patients, schedule, and availability.</p>
        </div>
      </div>

      <CaregiverLayout currentView={currentView} onNavigate={setCurrentView}>
        {renderView()}
      </CaregiverLayout>
    </div>
  );
};

export default CaregiverDashboard;
