
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CalendarPlus } from 'lucide-react';
import { toast } from 'sonner';

const AppointmentScheduler = ({ onSuccess, initialData = null, onCancel = null }) => {
  const [patients, setPatients] = useState([]);
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [formData, setFormData] = useState({
    patient_id: initialData?.patient_id || '',
    caregiver_id: initialData?.caregiver_id || '',
    appointment_date: initialData?.appointment_date ? initialData.appointment_date.split(' ')[0] : '',
    appointment_time: initialData?.appointment_time || '',
    notes: initialData?.notes || ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [patientsRes, caregiversRes] = await Promise.all([
          pb.collection('patients').getFullList({ sort: 'name', $autoCancel: false }),
          pb.collection('users').getFullList({ filter: 'role="caregiver"', sort: 'name', $autoCancel: false })
        ]);
        setPatients(patientsRes);
        setCaregivers(caregiversRes);
      } catch (error) {
        console.error('Error fetching data for scheduler:', error);
        toast.error('Failed to load patients and caregivers');
      } finally {
        setFetching(false);
      }
    };
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.caregiver_id || !formData.appointment_date || !formData.appointment_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        appointment_date: `${formData.appointment_date} 00:00:00.000Z`,
        status: initialData?.status || 'scheduled',
        reminder_sent: initialData?.reminder_sent || false
      };

      if (initialData?.id) {
        await pb.collection('appointments').update(initialData.id, payload, { $autoCancel: false });
        toast.success('Appointment updated successfully');
      } else {
        await pb.collection('appointments').create(payload, { $autoCancel: false });
        toast.success('Appointment scheduled successfully');
      }
      
      if (!initialData) {
        setFormData({
          patient_id: '',
          caregiver_id: '',
          appointment_date: '',
          appointment_time: '',
          notes: ''
        });
      }
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error scheduling appointment:', error);
      toast.error('Failed to save appointment');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <Card className="border-0 shadow-soft rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarPlus className="h-5 w-5 text-primary" />
          {initialData ? 'Edit Appointment' : 'Schedule Appointment'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Patient *</Label>
              <Select value={formData.patient_id} onValueChange={(val) => setFormData({...formData, patient_id: val})}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select patient" />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Caregiver *</Label>
              <Select value={formData.caregiver_id} onValueChange={(val) => setFormData({...formData, caregiver_id: val})}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select caregiver" />
                </SelectTrigger>
                <SelectContent>
                  {caregivers.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.name || c.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Date *</Label>
              <Input 
                type="date" 
                value={formData.appointment_date}
                onChange={(e) => setFormData({...formData, appointment_date: e.target.value})}
                className="bg-white"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Time *</Label>
              <Input 
                type="time" 
                value={formData.appointment_time}
                onChange={(e) => setFormData({...formData, appointment_time: e.target.value})}
                className="bg-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea 
              placeholder="Any special instructions or notes for this appointment..."
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="bg-white resize-none"
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} className="w-full">
                Cancel
              </Button>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {initialData ? 'Update' : 'Schedule'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default AppointmentScheduler;
