import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Utensils, Droplets, Pill, HeartPulse, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const CaregiverCareLogPage = () => {
  const { currentUser } = useAuth();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    update_type: '',
    description: ''
  });

  const updateTypes = [
    { id: 'feeding', label: 'Feeding/Meals', icon: Utensils },
    { id: 'bathing', label: 'Bathing/Hygiene', icon: Droplets },
    { id: 'exercise', label: 'Exercise/Mobility', icon: Activity },
    { id: 'medication', label: 'Medication', icon: Pill },
    { id: 'vitals', label: 'Vitals Check', icon: HeartPulse },
    { id: 'activity', label: 'Social Activity', icon: CheckCircle2 },
    { id: 'other', label: 'Other', icon: CheckCircle2 },
  ];

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const records = await pb.collection('patient_assignments').getFullList({
          filter: `caregiver_id = "${currentUser.id}" && status = "active"`,
          expand: 'patient_id',
          $autoCancel: false
        });
        setPatients(records.map(r => r.expand.patient_id));
      } catch (error) {
        console.error(error);
      }
    };
    fetchPatients();
  }, [currentUser.id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.update_type || !formData.description) {
      return toast.error('Please fill in all required fields');
    }

    setLoading(true);
    try {
      await pb.collection('care_updates').create({
        patient_id: formData.patient_id,
        caregiver_id: currentUser.id,
        update_type: formData.update_type,
        description: formData.description,
        time_logged: new Date().toISOString(),
      }, { $autoCancel: false });
      
      toast.success('Care log submitted successfully');
      setFormData({ ...formData, description: '', update_type: '' });
    } catch (error) {
      console.error(error);
      toast.error('Failed to submit care log');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold text-foreground">Daily Care Log</h1>
        <p className="text-muted-foreground">Record activities, vitals, and updates for your patients.</p>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle>New Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Select Patient</Label>
              <Select 
                value={formData.patient_id} 
                onValueChange={(val) => setFormData({...formData, patient_id: val})}
              >
                <SelectTrigger className="bg-white text-foreground">
                  <SelectValue placeholder="Choose a patient..." />
                </SelectTrigger>
                <SelectContent>
                  {patients.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Activity Type</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {updateTypes.map((type) => {
                  const isSelected = formData.update_type === type.id;
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => setFormData({...formData, update_type: type.id})}
                      className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${
                        isSelected 
                          ? 'bg-secondary/10 border-secondary text-secondary shadow-sm' 
                          : 'bg-white border-border text-muted-foreground hover:bg-muted/50'
                      }`}
                    >
                      <type.icon className={`h-6 w-6 mb-2 ${isSelected ? 'text-secondary' : ''}`} />
                      <span className="text-xs font-medium text-center">{type.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes & Details</Label>
              <Textarea 
                placeholder="Describe the care provided, patient's mood, or any observations..."
                className="min-h-[120px] bg-white text-foreground resize-none"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <Button type="submit" className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Care Log
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CaregiverCareLogPage;