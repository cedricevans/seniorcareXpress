
import React, { useState } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, FileText, Utensils, Droplets, Activity, Pill, HeartPulse, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const CaregiverCareNotesForm = ({ patients, onSuccess }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    patient_id: '',
    update_type: '',
    note_text: '',
    is_urgent: false
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.patient_id || !formData.note_text || !formData.update_type) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Save to care_updates collection as per schema
      await pb.collection('care_updates').create({
        patient_id: formData.patient_id,
        caregiver_id: currentUser.id,
        update_type: formData.update_type,
        description: formData.note_text,
        time_logged: new Date().toISOString(),
      }, { $autoCancel: false });
      
      // Also save to caregiver_notes if needed, but care_updates is more comprehensive
      await pb.collection('caregiver_notes').create({
        patient_id: formData.patient_id,
        caregiver_id: currentUser.id,
        note_text: formData.note_text,
        is_urgent: formData.is_urgent
      }, { $autoCancel: false });
      
      toast.success('Care note added successfully');
      setFormData({
        patient_id: '',
        update_type: '',
        note_text: '',
        is_urgent: false
      });
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Error adding care note:', error);
      toast.error('Failed to add care note');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-soft rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Add Care Note
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
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

          <div className="space-y-3">
            <Label>Activity Type *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {updateTypes.map((type) => {
                const isSelected = formData.update_type === type.id;
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({...formData, update_type: type.id})}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      isSelected 
                        ? 'bg-primary/10 border-primary text-primary shadow-sm' 
                        : 'bg-white border-border text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    <type.icon className={`h-5 w-5 mb-1 ${isSelected ? 'text-primary' : ''}`} />
                    <span className="text-xs font-medium text-center">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Note Details *</Label>
            <Textarea 
              placeholder="Enter your observation or note..."
              value={formData.note_text}
              onChange={(e) => setFormData({...formData, note_text: e.target.value})}
              className="bg-white resize-none"
              rows={4}
              required
            />
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="urgent" 
              checked={formData.is_urgent}
              onCheckedChange={(checked) => setFormData({...formData, is_urgent: checked})}
            />
            <label
              htmlFor="urgent"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-destructive"
            >
              Mark as Urgent
            </label>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Save Note
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CaregiverCareNotesForm;
