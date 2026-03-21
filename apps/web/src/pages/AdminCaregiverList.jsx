
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, HeartHandshake, Mail, Edit, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';

const AdminCaregiverList = () => {
  const [caregivers, setCaregivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCaregiver, setSelectedCaregiver] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '', email: '', password: ''
  });

  const fetchCaregivers = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('users').getList(1, 50, {
        filter: 'role = "caregiver"',
        sort: '-created',
        $autoCancel: false
      });
      setCaregivers(records.items);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load caregivers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCaregivers();
  }, []);

  const handleOpenCreate = () => {
    setSelectedCaregiver(null);
    setFormData({ name: '', email: '', password: '' });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (caregiver) => {
    setSelectedCaregiver(caregiver);
    setFormData({
      name: caregiver.name || '',
      email: caregiver.email || '',
      password: '' // Don't pre-fill password
    });
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (caregiver) => {
    setSelectedCaregiver(caregiver);
    setIsDeleteDialogOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        role: 'caregiver',
        emailVisibility: true
      };

      if (formData.password) {
        payload.password = formData.password;
        payload.passwordConfirm = formData.password;
      }

      if (selectedCaregiver) {
        await pb.collection('users').update(selectedCaregiver.id, payload, { $autoCancel: false });
        toast.success('Caregiver updated successfully');
      } else {
        if (!formData.password) {
          toast.error('Password is required for new caregivers');
          return;
        }
        await pb.collection('users').create(payload, { $autoCancel: false });
        toast.success('Caregiver added successfully');
      }
      setIsDialogOpen(false);
      fetchCaregivers();
    } catch (error) {
      toast.error(selectedCaregiver ? 'Failed to update caregiver' : 'Failed to add caregiver');
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('users').delete(selectedCaregiver.id, { $autoCancel: false });
      toast.success('Caregiver deleted successfully');
      setIsDeleteDialogOpen(false);
      fetchCaregivers();
    } catch (error) {
      toast.error('Failed to delete caregiver');
    }
  };

  const filteredCaregivers = caregivers.filter(c => 
    (c.name || '').toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Caregivers</h2>
          <p className="text-muted-foreground">Manage care staff and assignments.</p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <HeartHandshake className="h-4 w-4" /> Invite Caregiver
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-soft border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Search caregivers..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-foreground"
          />
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Caregiver</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredCaregivers.length === 0 ? (
                <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No caregivers found.</TableCell></TableRow>
              ) : (
                filteredCaregivers.map((caregiver) => (
                  <TableRow key={caregiver.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-secondary/10 flex items-center justify-center">
                          <HeartHandshake className="h-4 w-4 text-secondary" />
                        </div>
                        {caregiver.name || 'Unnamed Caregiver'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        {caregiver.email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => toast('View patients feature coming soon')} className="text-muted-foreground hover:text-primary" title="View Assigned Patients">
                          <Users className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEdit(caregiver)} className="text-muted-foreground hover:text-primary">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(caregiver)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{selectedCaregiver ? 'Edit Caregiver' : 'Invite Caregiver'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input id="email" type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{selectedCaregiver ? 'New Password (leave blank to keep current)' : 'Password *'}</Label>
              <Input id="password" type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required={!selectedCaregiver} />
            </div>
            <div className="pt-4 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit">Save Caregiver</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Caregiver</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete <strong>{selectedCaregiver?.name || selectedCaregiver?.email}</strong>? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCaregiverList;
