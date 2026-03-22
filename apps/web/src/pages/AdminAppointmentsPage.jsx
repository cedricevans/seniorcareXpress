
import React, { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, User, Edit, Trash2, Plus, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import AppointmentScheduler from '@/components/AppointmentScheduler.jsx';

const STATUS_OPTIONS = ['scheduled', 'completed', 'canceled', 'no-show'];

const getStatusBadge = (status) => {
  switch (status) {
    case 'scheduled':  return <Badge className="bg-green-100 text-green-700 border-0">Scheduled</Badge>;
    case 'completed':  return <Badge className="bg-blue-100 text-blue-700 border-0">Completed</Badge>;
    case 'canceled':   return <Badge className="bg-red-100 text-red-700 border-0">Canceled</Badge>;
    case 'no-show':    return <Badge className="bg-gray-100 text-gray-700 border-0">No-Show</Badge>;
    default:           return <Badge variant="outline">{status}</Badge>;
  }
};

const AdminAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const [isSchedulerOpen, setIsSchedulerOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const filter = statusFilter !== 'all' ? `status = "${statusFilter}"` : '';
      const records = await pb.collection('appointments').getList(1, 100, {
        filter,
        expand: 'patient_id,caregiver_id',
        sort: '-appointment_date',
        $autoCancel: false,
      });
      setAppointments(records.items);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const handleOpenCreate = () => {
    setEditTarget(null);
    setIsSchedulerOpen(true);
  };

  const handleOpenEdit = (apt) => {
    setEditTarget(apt);
    setIsSchedulerOpen(true);
  };

  const handleOpenDelete = (apt) => {
    setDeleteTarget(apt);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    try {
      await pb.collection('appointments').delete(deleteTarget.id, { $autoCancel: false });
      toast.success('Appointment deleted');
      setIsDeleteOpen(false);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to delete appointment');
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await pb.collection('appointments').update(id, { status: newStatus }, { $autoCancel: false });
      toast.success(`Status updated to ${newStatus}`);
      fetchAppointments();
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Appointments</h2>
          <p className="text-muted-foreground">Schedule and manage all patient appointments.</p>
        </div>
        <Button className="gap-2" onClick={handleOpenCreate}>
          <Plus className="h-4 w-4" /> Schedule Appointment
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-muted-foreground">Filter by status:</span>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {STATUS_OPTIONS.map(s => (
              <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={fetchAppointments} disabled={loading}>Refresh</Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-soft border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Patient</TableHead>
                <TableHead>Caregiver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <TableCell key={j}><Skeleton className="h-6 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : appointments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <Calendar className="h-8 w-8 opacity-30" />
                      No appointments found.
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                appointments.map((apt) => (
                  <TableRow key={apt.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="flex items-center gap-2 font-medium">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(apt.appointment_date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {apt.appointment_time}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {apt.expand?.patient_id?.name || apt.patient_id}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {apt.expand?.caregiver_id?.name || apt.expand?.caregiver_id?.email || apt.caregiver_id}
                    </TableCell>
                    <TableCell>{getStatusBadge(apt.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-1">
                        {apt.status === 'scheduled' && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Mark Complete"
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              onClick={() => handleStatusChange(apt.id, 'completed')}
                            >
                              <CheckCircle2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Mark Canceled"
                              className="text-orange-500 hover:text-orange-600 hover:bg-orange-50"
                              onClick={() => handleStatusChange(apt.id, 'canceled')}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              title="Mark No-Show"
                              className="text-muted-foreground hover:text-foreground"
                              onClick={() => handleStatusChange(apt.id, 'no-show')}
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Edit"
                          className="text-muted-foreground hover:text-primary"
                          onClick={() => handleOpenEdit(apt)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => handleOpenDelete(apt)}
                        >
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

      {/* Schedule / Edit Dialog */}
      <Dialog open={isSchedulerOpen} onOpenChange={setIsSchedulerOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editTarget ? 'Edit Appointment' : 'Schedule New Appointment'}</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <AppointmentScheduler
              initialData={editTarget}
              onSuccess={() => {
                setIsSchedulerOpen(false);
                fetchAppointments();
              }}
              onCancel={() => setIsSchedulerOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Appointment</DialogTitle>
          </DialogHeader>
          <div className="py-4 text-muted-foreground">
            Are you sure you want to delete this appointment for{' '}
            <strong className="text-foreground">
              {deleteTarget?.expand?.patient_id?.name || 'this patient'}
            </strong>{' '}
            on{' '}
            <strong className="text-foreground">
              {deleteTarget ? new Date(deleteTarget.appointment_date).toLocaleDateString() : ''}
            </strong>?
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminAppointmentsPage;
