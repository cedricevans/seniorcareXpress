
import React from 'react';
import { Route, Routes, BrowserRouter as Router, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import PortalLayout from './components/PortalLayout.jsx';

// Public Pages
import HomePage from './pages/HomePage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import ServicesPage from './pages/ServicesPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import VeteransPage from './pages/VeteransPage.jsx';
import CareersPage from './pages/CareersPage.jsx';

// Portal Dashboards
import AdminDashboard from './pages/AdminDashboard.jsx';
import AdminPatientList from './pages/AdminPatientList.jsx';
import AdminCaregiverList from './pages/AdminCaregiverList.jsx';
import AdminAppointmentsPage from './pages/AdminAppointmentsPage.jsx';
import AdminAssignmentsPage from './pages/AdminAssignmentsPage.jsx';
import MessagesPage from './pages/MessagesPage.jsx';
import AdminCarePlansPage from './pages/AdminCarePlansPage.jsx';
import FamilyBookAppointmentPage from './pages/FamilyBookAppointmentPage.jsx';
import AdminReportsPage from './pages/AdminReportsPage.jsx';
import CaregiverDashboard from './pages/CaregiverDashboard.jsx';
import CaregiverSchedulePage from './pages/CaregiverSchedulePage.jsx';
import FamilyDashboard from './pages/FamilyDashboard.jsx';
import PatientDashboard from './pages/PatientDashboard.jsx';
import PlaceholderPage from './pages/PlaceholderPage.jsx';

// Wrapper for public pages to include Header/Footer
const PublicLayout = ({ children }) => (
  <div className="min-h-screen flex flex-col bg-background text-foreground">
    <Header />
    <main className="flex-1 flex flex-col">{children}</main>
    <Footer />
  </div>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <ScrollToTop />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><HomePage /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutPage /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><ServicesPage /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><ContactPage /></PublicLayout>} />
          <Route path="/login" element={<PublicLayout><LoginPage /></PublicLayout>} />
          <Route path="/veterans" element={<PublicLayout><VeteransPage /></PublicLayout>} />
          <Route path="/careers" element={<PublicLayout><CareersPage /></PublicLayout>} />

          {/* Admin Portal Routes */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><PortalLayout><AdminDashboard /></PortalLayout></ProtectedRoute>} />
          <Route path="/admin/patients" element={<ProtectedRoute allowedRoles={['admin']}><PortalLayout><AdminPatientList /></PortalLayout></ProtectedRoute>} />
          <Route path="/admin/caregivers" element={<ProtectedRoute allowedRoles={['admin']}><PortalLayout><AdminCaregiverList /></PortalLayout></ProtectedRoute>} />
          <Route path="/admin/appointments" element={<ProtectedRoute allowedRoles={['admin']}><PortalLayout><AdminAppointmentsPage /></PortalLayout></ProtectedRoute>} />
          <Route path="/admin/assignments" element={<ProtectedRoute allowedRoles={['admin']}><PortalLayout><AdminAssignmentsPage /></PortalLayout></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={['admin']}><PortalLayout><PlaceholderPage title="Analytics Dashboard" /></PortalLayout></ProtectedRoute>} />
          <Route path="/admin/messages" element={<ProtectedRoute allowedRoles={['admin']}><PortalLayout><MessagesPage /></PortalLayout></ProtectedRoute>} />
          <Route path="/admin/care-plans" element={<ProtectedRoute allowedRoles={['admin']}><PortalLayout><AdminCarePlansPage /></PortalLayout></ProtectedRoute>} />
          <Route path="/admin/reports" element={<ProtectedRoute allowedRoles={['admin']}><PortalLayout><AdminReportsPage /></PortalLayout></ProtectedRoute>} />

          {/* Caregiver Portal Routes */}
          <Route path="/caregiver" element={<ProtectedRoute allowedRoles={['caregiver']}><PortalLayout><CaregiverDashboard /></PortalLayout></ProtectedRoute>} />
          <Route path="/caregiver/patients" element={<ProtectedRoute allowedRoles={['caregiver']}><PortalLayout><CaregiverDashboard /></PortalLayout></ProtectedRoute>} />
          <Route path="/caregiver/appointments" element={<ProtectedRoute allowedRoles={['caregiver']}><PortalLayout><CaregiverDashboard /></PortalLayout></ProtectedRoute>} />
          <Route path="/caregiver/availability" element={<ProtectedRoute allowedRoles={['caregiver']}><PortalLayout><CaregiverSchedulePage /></PortalLayout></ProtectedRoute>} />
          <Route path="/caregiver/messages" element={<ProtectedRoute allowedRoles={['caregiver']}><PortalLayout><MessagesPage /></PortalLayout></ProtectedRoute>} />

          {/* Family Portal Routes */}
          <Route path="/family" element={<ProtectedRoute allowedRoles={['family']}><PortalLayout><FamilyDashboard /></PortalLayout></ProtectedRoute>} />
          <Route path="/family/book-appointment" element={<ProtectedRoute allowedRoles={['family']}><PortalLayout><FamilyBookAppointmentPage /></PortalLayout></ProtectedRoute>} />
          <Route path="/family/medical-records" element={<ProtectedRoute allowedRoles={['family']}><PortalLayout><FamilyDashboard /></PortalLayout></ProtectedRoute>} />
          <Route path="/family/messages" element={<ProtectedRoute allowedRoles={['family']}><PortalLayout><MessagesPage /></PortalLayout></ProtectedRoute>} />

          {/* Patient Portal Routes */}
          <Route path="/patient" element={<ProtectedRoute allowedRoles={['patient', 'family']}><PortalLayout><PatientDashboard /></PortalLayout></ProtectedRoute>} />
          <Route path="/patient/appointments" element={<ProtectedRoute allowedRoles={['patient', 'family']}><PortalLayout><PatientDashboard /></PortalLayout></ProtectedRoute>} />
          <Route path="/patient/medical-records" element={<ProtectedRoute allowedRoles={['patient', 'family']}><PortalLayout><PatientDashboard /></PortalLayout></ProtectedRoute>} />
          <Route path="/patient/messages" element={<ProtectedRoute allowedRoles={['patient', 'family']}><PortalLayout><MessagesPage /></PortalLayout></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={
            <PublicLayout>
              <div className="flex-1 flex items-center justify-center flex-col gap-4 py-20">
                <h1 className="text-4xl font-heading font-bold">404 - Page Not Found</h1>
                <a href="/" className="text-primary hover:underline font-medium">Return Home</a>
              </div>
            </PublicLayout>
          } />
        </Routes>
        <Toaster position="top-center" />
      </Router>
    </AuthProvider>
  );
}

export default App;
