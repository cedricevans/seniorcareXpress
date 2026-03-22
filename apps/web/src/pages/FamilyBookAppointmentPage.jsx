import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar } from 'lucide-react';
import { toast } from 'sonner';

const FamilyBookAppointmentPage = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [patient, setPatient] = useState(null);
  const [caregivers, setCaregivers] = useState([]);
  const [form, setForm] = useState({
    title: 'Care Visit',
    description: '',
    appointment_date: '',
    appointment_time: '',
    appointment_type: 'check-up',
    caregiver_id: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const links = await pb.collection('family_links').getFullList({
          filter: `family_user_id="${currentUser.id}"`,
          expand: 'patient_id',
          $autoCancel: false,
        });
        const linkedPatient = links[0]?.expand?.patient_id || null;
        setPatient(linkedPatient);

        const caregiversRes = await pb.collection('users').getFullList({
          filter: 'role = "caregiver"',
          sort: 'name',
          $autoCancel: false,
        });
        setCaregivers(caregiversRes);
      } catch (err) {
        console.error('Failed to load booking data:', err);
        toast.error('Failed to load booking data');
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) load();
  }, [currentUser]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!patient) {
      toast.error('No patient linked to your account');
      return;
    }
    if (!form.appointment_date || !form.appointment_time) {
      toast.error('Please select date and time');
      return;
    }
    setSaving(true);
    try {
      await pb.collection('appointments').create({
        patient_id: patient.id,
        caregiver_id: form.caregiver_id || null,
        title: form.title,
        description: form.description,
        appointment_date: form.appointment_date,
        appointment_time: form.appointment_time,
        appointment_type: form.appointment_type,
        status: 'scheduled',
        duration_minutes: 60,
      }, { $autoCancel: false });
      toast.success('Appointment request submitted');
      setForm((prev) => ({ ...prev, description: '', appointment_date: '', appointment_time: '' }));
    } catch (err) {
      console.error('Failed to book appointment:', err);
      toast.error('Failed to book appointment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="text-center py-20">
        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold">No Patient Linked</h2>
        <p className="text-muted-foreground mt-2">Please contact support to link your account to a patient.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Helmet>
        <title>Book Appointment | SeniorCare Xpress</title>
      </Helmet>

      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Book Appointment</h1>
        <p className="text-muted-foreground mt-1">Schedule a visit for {patient.first_name} {patient.last_name}.</p>
      </div>

      <Card className="border-0 shadow-soft rounded-2xl">
        <CardHeader>
          <CardTitle>Appointment Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date *</Label>
                <Input type="date" value={form.appointment_date} onChange={(e) => setForm((prev) => ({ ...prev, appointment_date: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Time *</Label>
                <Input type="time" value={form.appointment_time} onChange={(e) => setForm((prev) => ({ ...prev, appointment_time: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Appointment Type</Label>
                <Select value={form.appointment_type} onValueChange={(val) => setForm((prev) => ({ ...prev, appointment_type: val }))}>
                  <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                  <SelectContent>
                    {['check-up', 'wellness', 'therapy', 'companionship', 'other'].map((t) => (
                      <SelectItem key={t} value={t}>{t.replace('-', ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Preferred Caregiver</Label>
                <Select value={form.caregiver_id} onValueChange={(val) => setForm((prev) => ({ ...prev, caregiver_id: val }))}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    {caregivers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name || c.email}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button type="submit" disabled={saving}>
              {saving ? 'Submitting...' : 'Submit Appointment Request'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default FamilyBookAppointmentPage;
