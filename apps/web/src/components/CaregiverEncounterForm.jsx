
import React, { useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Activity } from 'lucide-react';
import { toast } from 'sonner';

const CaregiverEncounterForm = ({ patients, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    encounter_date: new Date().toISOString().split('T')[0],
    visit_notes: '',
    bp: '',
    hr: '',
    temp: ''
  });
  const [files, setFiles] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.encounter_date || !formData.visit_notes) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('patient_id', formData.patient_id);
      data.append('caregiver_id', currentUser.id);
      data.append('encounter_date', formData.encounter_date + ' 00:00:00.000Z');
      data.append('visit_notes', formData.visit_notes);
      
      const vitals = {
        blood_pressure: formData.bp,
        heart_rate: formData.hr,
        temperature: formData.temp
      };
      data.append('vital_signs', JSON.stringify(vitals));

      if (files) {
        for (let i = 0; i < files.length; i++) {
          data.append('documents', files[i]);
        }
      }

      await pb.collection('encounters').create(data, { $autoCancel: false });
      
      toast.success('Encounter logged successfully');
      setFormData({
        patient_id: '',
        encounter_date: new Date().toISOString().split('T')[0],
        visit_notes: '',
        bp: '',
        hr: '',
        temp: ''
      });
      setFiles(null);
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error logging encounter:', error);
      toast.error('Failed to log encounter');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-soft rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          Log Encounter
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
              <Label>Date *</Label>
              <Input 
                type="date" 
                value={formData.encounter_date}
                onChange={(e) => setFormData({...formData, encounter_date: e.target.value})}
                className="bg-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Visit Notes *</Label>
            <Textarea 
              placeholder="Detailed notes about the visit..."
              value={formData.visit_notes}
              onChange={(e) => setFormData({...formData, visit_notes: e.target.value})}
              className="bg-white resize-none"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-xl border border-border">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Blood Pressure</Label>
              <Input placeholder="120/80" value={formData.bp} onChange={(e) => setFormData({...formData, bp: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Heart Rate</Label>
              <Input placeholder="72 bpm" value={formData.hr} onChange={(e) => setFormData({...formData, hr: e.target.value})} className="bg-white" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Temperature</Label>
              <Input placeholder="98.6 °F" value={formData.temp} onChange={(e) => setFormData({...formData, temp: e.target.value})} className="bg-white" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Documents / Photos (Max 5)</Label>
            <Input 
              type="file" 
              multiple 
              onChange={(e) => setFiles(e.target.files)}
              className="bg-white cursor-pointer"
              accept="image/*,.pdf"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Encounter
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CaregiverEncounterForm;
