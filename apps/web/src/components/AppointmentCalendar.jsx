
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import pb from '@/lib/pocketbaseClient';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar as CalendarIcon, Clock, User, Activity, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import AppointmentScheduler from './AppointmentScheduler.jsx';

const localizer = momentLocalizer(moment);

const AppointmentCalendar = ({ filterCaregiverId = null, filterPatientId = null, readOnly = false }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      let filterStr = '';
      if (filterCaregiverId) filterStr = `caregiver_id="${filterCaregiverId}"`;
      if (filterPatientId) filterStr = filterStr ? `${filterStr} && patient_id="${filterPatientId}"` : `patient_id="${filterPatientId}"`;

      const records = await pb.collection('appointments').getFullList({
        filter: filterStr,
        expand: 'patient_id,caregiver_id',
        $autoCancel: false
      });

      const formattedEvents = records.map(record => {
        const dateStr = `${record.appointment_date.split(' ')[0]}T${record.appointment_time}`;
        const startDate = new Date(dateStr);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // Assume 1 hour duration

        return {
          id: record.id,
          title: `${record.expand?.patient_id?.name || 'Patient'} w/ ${record.expand?.caregiver_id?.name || 'Caregiver'}`,
          start: startDate,
          end: endDate,
          resource: record
        };
      });

      setEvents(formattedEvents);
    } catch (error) {
      console.error('Error fetching appointments for calendar:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [filterCaregiverId, filterPatientId]);

  const handleDelete = async () => {
    if (!selectedEvent || !window.confirm('Are you sure you want to delete this appointment?')) return;
    try {
      await pb.collection('appointments').delete(selectedEvent.id, { $autoCancel: false });
      toast.success('Appointment deleted');
      setSelectedEvent(null);
      fetchAppointments();
    } catch (error) {
      toast.error('Failed to delete appointment');
    }
  };

  if (loading && events.length === 0) {
    return (
      <Card className="border-0 shadow-soft rounded-2xl h-[600px] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <>
      <Card className="border-0 shadow-soft rounded-2xl overflow-hidden">
        <CardContent className="p-6">
          <div className="h-[600px]">
            <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              views={['month', 'week', 'day']}
              defaultView="week"
              onSelectEvent={(event) => setSelectedEvent(event)}
              tooltipAccessor={(event) => `${event.title}\nStatus: ${event.resource.status}\nNotes: ${event.resource.notes || 'None'}`}
              eventPropGetter={(event) => {
                let backgroundColor = '#1e40af'; // primary
                if (event.resource.status === 'completed') backgroundColor = '#16a34a';
                if (event.resource.status === 'canceled') backgroundColor = '#dc2626';
                return { style: { backgroundColor, borderRadius: '6px', border: 'none', cursor: 'pointer' } };
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedEvent} onOpenChange={(open) => { if (!open) { setSelectedEvent(null); setIsEditing(false); } }}>
        <DialogContent className="sm:max-w-[500px]">
          {isEditing ? (
            <AppointmentScheduler 
              initialData={selectedEvent?.resource} 
              onCancel={() => setIsEditing(false)}
              onSuccess={() => {
                setIsEditing(false);
                setSelectedEvent(null);
                fetchAppointments();
              }}
            />
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-xl">
                  <CalendarIcon className="h-5 w-5 text-primary" />
                  Appointment Details
                </DialogTitle>
              </DialogHeader>
              
              {selectedEvent && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Patient</p>
                      <p className="font-medium">{selectedEvent.resource.expand?.patient_id?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border">
                    <Activity className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Caregiver</p>
                      <p className="font-medium">{selectedEvent.resource.expand?.caregiver_id?.name || selectedEvent.resource.expand?.caregiver_id?.email || 'Unknown'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border">
                      <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Date</p>
                        <p className="font-medium">{new Date(selectedEvent.resource.appointment_date).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl border">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Time</p>
                        <p className="font-medium">{selectedEvent.resource.appointment_time}</p>
                      </div>
                    </div>
                  </div>

                  {selectedEvent.resource.notes && (
                    <div className="p-3 bg-muted/30 rounded-xl border">
                      <p className="text-sm text-muted-foreground mb-1">Notes</p>
                      <p className="text-sm">{selectedEvent.resource.notes}</p>
                    </div>
                  )}
                  
                  <div className="p-3 bg-muted/30 rounded-xl border flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                      selectedEvent.resource.status === 'completed' ? 'bg-green-100 text-green-700' :
                      selectedEvent.resource.status === 'canceled' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {selectedEvent.resource.status}
                    </span>
                  </div>
                </div>
              )}

              {!readOnly && (
                <DialogFooter className="flex sm:justify-between">
                  <Button variant="destructive" onClick={handleDelete} className="gap-2">
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                  <Button onClick={() => setIsEditing(true)} className="gap-2">
                    <Edit className="h-4 w-4" /> Edit
                  </Button>
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AppointmentCalendar;
