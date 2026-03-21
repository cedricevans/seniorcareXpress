
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, User, CheckCircle2, XCircle, FileText } from 'lucide-react';
import { toast } from 'sonner';

const CaregiverAppointmentsView = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('appointments').getList(1, 50, {
        filter: `caregiver_id="${currentUser.id}"`,
        expand: 'patient_id',
        sort: '-appointment_date',
        $autoCancel: false
      });
      setAppointments(records.items);
    } catch (err) {
      console.error("Error fetching appointments:", err);
      setError("Failed to load appointments.");
      toast.error("Failed to load appointments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchAppointments();
    }
  }, [currentUser]);

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await pb.collection('appointments').update(id, { status: newStatus }, { $autoCancel: false });
      toast.success(`Appointment marked as ${newStatus}`);
      fetchAppointments();
    } catch (err) {
      console.error("Error updating status:", err);
      toast.error("Failed to update appointment status.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'scheduled': return <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-0">Scheduled</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">Completed</Badge>;
      case 'canceled': return <Badge className="bg-red-100 text-red-700 hover:bg-red-200 border-0">Canceled</Badge>;
      case 'no-show': return <Badge className="bg-gray-100 text-gray-700 hover:bg-gray-200 border-0">No-Show</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-2xl border border-destructive/20">
        <p className="text-destructive font-medium mb-4">{error}</p>
        <Button onClick={fetchAppointments} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">Appointments</h2>
        <Button variant="outline" onClick={fetchAppointments} disabled={loading}>Refresh</Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center shadow-soft">
          <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Appointments</h3>
          <p className="text-muted-foreground">You don't have any appointments scheduled.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((apt) => (
            <Card key={apt.id} className="border-0 shadow-sm hover:shadow-md transition-shadow rounded-2xl overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Date/Time Block */}
                  <div className="bg-muted/30 p-6 md:w-48 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-border">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      {new Date(apt.appointment_date).toLocaleString('default', { month: 'short' })}
                    </span>
                    <span className="text-3xl font-bold text-foreground my-1">
                      {new Date(apt.appointment_date).getDate()}
                    </span>
                    <div className="flex items-center gap-1.5 text-sm font-medium text-primary mt-2 bg-primary/10 px-3 py-1 rounded-full">
                      <Clock className="w-3.5 h-3.5" />
                      {apt.appointment_time}
                    </div>
                  </div>
                  
                  {/* Details Block */}
                  <div className="p-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <User className="w-5 h-5 text-muted-foreground" />
                        <h3 className="text-lg font-bold">{apt.expand?.patient_id?.name || 'Unknown Patient'}</h3>
                      </div>
                      {getStatusBadge(apt.status)}
                    </div>
                    
                    {apt.notes && (
                      <div className="flex items-start gap-2 mt-3 text-sm text-muted-foreground bg-muted/20 p-3 rounded-lg">
                        <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                        <p>{apt.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions Block */}
                  <div className="p-6 bg-muted/10 flex flex-row md:flex-col justify-center gap-2 border-t md:border-t-0 md:border-l border-border">
                    {apt.status === 'scheduled' && (
                      <>
                        <Button 
                          size="sm" 
                          className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white"
                          onClick={() => handleStatusUpdate(apt.id, 'completed')}
                        >
                          <CheckCircle2 className="w-4 h-4" /> Complete
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleStatusUpdate(apt.id, 'canceled')}
                        >
                          <XCircle className="w-4 h-4" /> Cancel
                        </Button>
                      </>
                    )}
                    <Button size="sm" variant="secondary" className="w-full">
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CaregiverAppointmentsView;
