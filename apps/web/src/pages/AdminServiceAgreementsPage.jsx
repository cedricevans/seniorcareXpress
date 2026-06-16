import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';
import { generateServiceAgreementPdf } from '@/lib/serviceAgreementPdf';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, FileSignature, Download, Mail, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';

const STATUS_BADGE = {
  submitted: 'bg-blue-50 text-blue-700 border-blue-200',
  reviewed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  archived: 'bg-slate-100 text-slate-600 border-slate-200',
};

const AdminServiceAgreementsPage = () => {
  const [agreements, setAgreements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selected, setSelected] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [exportingId, setExportingId] = useState(null);

  const fetchAgreements = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('service_agreements').getList(1, 100, {
        sort: '-created',
        $autoCancel: false,
      });
      setAgreements(records.items);
    } catch (error) {
      console.error('Failed to fetch service agreements:', error);
      toast.error('Failed to load service agreements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgreements();
  }, []);

  const handleViewDetails = (agreement) => {
    setSelected(agreement);
    setDetailOpen(true);
  };

  const handleOpenDelete = (agreement) => {
    setSelected(agreement);
    setDeleteOpen(true);
  };

  const handleMarkReviewed = async (agreement) => {
    try {
      await pb.collection('service_agreements').update(agreement.id, { status: 'reviewed' }, { $autoCancel: false });
      toast.success('Marked as reviewed');
      fetchAgreements();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async () => {
    try {
      await pb.collection('service_agreements').delete(selected.id, { $autoCancel: false });
      toast.success('Agreement deleted');
      setDeleteOpen(false);
      fetchAgreements();
    } catch (error) {
      toast.error('Failed to delete agreement');
    }
  };

  const handleExportPdf = async (agreement) => {
    setExportingId(agreement.id);
    try {
      await generateServiceAgreementPdf(agreement.form_data || {});
    } catch (error) {
      console.error(error);
      toast.error('Could not generate PDF');
    } finally {
      setExportingId(null);
    }
  };

  const filtered = agreements.filter(
    (a) =>
      (a.client_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.client_email || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Service Agreements</h2>
          <p className="text-muted-foreground">Review submissions from the public intake form.</p>
        </div>
        <Link to="/admin/service-agreement">
          <Button className="gap-2">
            <Plus className="h-4 w-4" /> Fill Out New Agreement
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-soft border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search by client name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-foreground"
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Client</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Email Sent</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-6 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-28 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No service agreements submitted yet.</TableCell></TableRow>
              ) : (
                filtered.map((agreement) => (
                  <TableRow key={agreement.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleViewDetails(agreement)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <FileSignature className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <div>{agreement.client_name}</div>
                          {agreement.client_email && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Mail className="h-3 w-3" /> {agreement.client_email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(agreement.created).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_BADGE[agreement.status] || ''}>
                        {agreement.status || 'submitted'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={`text-sm ${agreement.email_sent ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                        {agreement.email_sent ? 'Sent' : 'Not sent'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost" size="icon"
                          onClick={() => handleExportPdf(agreement)}
                          disabled={exportingId === agreement.id}
                          className="text-muted-foreground hover:text-primary"
                          title="Download PDF"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(agreement)} className="text-muted-foreground hover:text-destructive" title="Delete">
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

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selected?.client_name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 py-2 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Email:</span> {selected.client_email || '—'}</div>
                <div><span className="text-muted-foreground">Status:</span> {selected.status}</div>
                <div><span className="text-muted-foreground">Phone:</span> {selected.form_data?.telephone || '—'}</div>
                <div><span className="text-muted-foreground">Start of Care:</span> {selected.form_data?.startOfCareDate || '—'}</div>
                <div><span className="text-muted-foreground">Hourly Rate:</span> ${selected.form_data?.hourlyRate || '—'}</div>
                <div><span className="text-muted-foreground">Payment Type:</span> {selected.form_data?.paymentType || '—'}</div>
              </div>
              <div className="pt-2 border-t">
                <span className="text-muted-foreground">Address:</span> {selected.form_data?.clientAddress || '—'}
              </div>
              <div className="pt-4 flex justify-end gap-2">
                {selected.status !== 'reviewed' && (
                  <Button variant="outline" onClick={() => { handleMarkReviewed(selected); setDetailOpen(false); }}>
                    Mark Reviewed
                  </Button>
                )}
                <Button onClick={() => handleExportPdf(selected)} className="gap-2">
                  <Download className="h-4 w-4" /> Download PDF
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Service Agreement</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the agreement for <strong>{selected?.client_name}</strong>? This action cannot be undone.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServiceAgreementsPage;
