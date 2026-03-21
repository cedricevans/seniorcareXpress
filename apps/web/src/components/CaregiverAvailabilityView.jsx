
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Plus, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'sonner';

const CaregiverAvailabilityView = () => {
  const { currentUser } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    day_of_week: 'Monday',
    start_time: '09:00',
    end_time: '17:00',
    is_available: true
  });

  const fetchSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const records = await pb.collection('caregiver_sessions').getList(1, 50, {
        filter: `caregiver_id="${currentUser.id}"`,
        sort: 'day_of_week,start_time',
        $autoCancel: false
      });
      setSessions(records.items);
    } catch (err) {
      console.error("Error fetching availability:", err);
      setError("Failed to load availability schedule.");
      toast.error("Failed to load availability schedule.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchSessions();
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await pb.collection('caregiver_sessions').create({
        caregiver_id: currentUser.id,
        ...formData
      }, { $autoCancel: false });
      
      toast.success('Availability slot added successfully');
      fetchSessions();
    } catch (err) {
      console.error("Error adding availability:", err);
      toast.error('Failed to add availability slot');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Remove this availability slot?')) return;
    try {
      await pb.collection('caregiver_sessions').delete(id, { $autoCancel: false });
      toast.success('Slot removed');
      fetchSessions();
    } catch (err) {
      console.error("Error deleting slot:", err);
      toast.error('Failed to remove slot');
    }
  };

  const daysOrder = { 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Friday': 5, 'Saturday': 6, 'Sunday': 7 };
  const sortedSessions = [...sessions].sort((a, b) => daysOrder[a.day_of_week] - daysOrder[b.day_of_week]);

  if (error) {
    return (
      <div className="p-8 text-center bg-destructive/10 rounded-2xl border border-destructive/20">
        <p className="text-destructive font-medium mb-4">{error}</p>
        <Button onClick={fetchSessions} variant="outline">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-foreground">My Availability</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Add Slot Form */}
        <div className="lg:col-span-1">
          <Card className="border-0 shadow-soft rounded-2xl sticky top-24">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Add Time Slot
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select value={formData.day_of_week} onValueChange={(v) => setFormData({...formData, day_of_week: v})}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select day" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(daysOrder).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Input type="time" value={formData.start_time} onChange={e => setFormData({...formData, start_time: e.target.value})} required className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Input type="time" value={formData.end_time} onChange={e => setFormData({...formData, end_time: e.target.value})} required className="bg-white" />
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2 pb-4">
                  <Checkbox 
                    id="is_available" 
                    checked={formData.is_available} 
                    onCheckedChange={(c) => setFormData({...formData, is_available: c})} 
                  />
                  <Label htmlFor="is_available" className="font-medium cursor-pointer">Mark as Available</Label>
                </div>

                <Button type="submit" className="w-full rounded-xl" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Availability'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Schedule List */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-soft rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-secondary" /> Current Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
                </div>
              ) : sortedSessions.length === 0 ? (
                <div className="text-center py-12 bg-muted/30 rounded-xl border border-dashed border-border">
                  <Clock className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                  <p className="text-muted-foreground">No availability slots configured yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 rounded-xl border border-border bg-white hover:border-primary/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${session.is_available ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          <Clock className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-foreground">{session.day_of_week}</h4>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            {session.start_time} - {session.end_time}
                            <span className="mx-2">•</span>
                            <span className={session.is_available ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>
                              {session.is_available ? 'Available' : 'Unavailable'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(session.id)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CaregiverAvailabilityView;
