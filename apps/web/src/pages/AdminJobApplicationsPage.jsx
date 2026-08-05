
import React, { useState, useEffect } from 'react';
import pb from '@/lib/pocketbaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, Briefcase, Mail, Phone, FileText, Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const AdminJobApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedApp, setSelectedApp] = useState(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const records = await pb.collection('job_applications').getFullList({
        sort: '-created',
        $autoCancel: false,
      });
      setApplications(records);
    } catch (error) {
      console.error('Failed to load job applications:', error);
      toast.error(`Failed to load applications: ${error?.message || 'Check your connection and permissions'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleViewDetails = (app) => {
    setSelectedApp(app);
    setDetailsDialogOpen(true);
  };

  const handleOpenDelete = (app) => {
    setSelectedApp(app);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await pb.collection('job_applications').delete(selectedApp.id, { $autoCancel: false });
      toast.success('Application deleted');
      setIsDeleteDialogOpen(false);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to delete application');
    }
  };

  const resumeUrl = (app) => app?.resume ? pb.files.getURL(app, app.resume) : null;

  const filteredApplications = applications.filter(a => {
    const q = search.toLowerCase();
    return (
      `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase().includes(q) ||
      (a.email || '').toLowerCase().includes(q) ||
      (a.cell_phone || '').toLowerCase().includes(q)
    );
  });

  const DetailRow = ({ label, value }) => (
    <div className="grid grid-cols-3 gap-2 py-1.5 border-b last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium col-span-2">{value || '—'}</span>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-heading font-bold text-foreground">Job Applications</h2>
          <p className="text-muted-foreground">Review employment applications and resumes submitted through the careers page.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-soft border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2">
          <Search className="h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search applicants..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-0 shadow-none focus-visible:ring-0 px-0 text-foreground"
          />
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Applicant</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead>Resume</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-10 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-8 w-24 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredApplications.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No applications found.</TableCell></TableRow>
              ) : (
                filteredApplications.map((app) => (
                  <TableRow key={app.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => handleViewDetails(app)}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Briefcase className="h-4 w-4 text-primary" />
                        </div>
                        <span>{app.first_name} {app.last_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{app.email}</div>
                        <div className="flex items-center gap-1"><Phone className="h-3 w-3" />{app.cell_phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">{app.created ? new Date(app.created).toLocaleDateString() : '—'}</span>
                    </TableCell>
                    <TableCell>
                      {app.resume ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Attached</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">None</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        {app.resume && (
                          <Button variant="ghost" size="icon" asChild className="text-muted-foreground hover:text-primary" title="Download Resume">
                            <a href={resumeUrl(app)} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDelete(app)} className="text-muted-foreground hover:text-destructive">
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

      {/* Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedApp?.first_name} {selectedApp?.last_name} — Application</DialogTitle>
          </DialogHeader>
          {selectedApp && (
            <div className="space-y-6 py-2">
              {selectedApp.resume && (
                <Button asChild className="w-full gap-2">
                  <a href={resumeUrl(selectedApp)} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4" /> View / Download Resume
                  </a>
                </Button>
              )}

              <div>
                <h4 className="font-semibold mb-2 text-foreground">Personal Information</h4>
                <DetailRow label="Email" value={selectedApp.email} />
                <DetailRow label="Cell Phone" value={selectedApp.cell_phone} />
                <DetailRow label="Home Phone" value={selectedApp.home_phone} />
                <DetailRow label="Address" value={`${selectedApp.address || ''} ${selectedApp.address2 || ''}`.trim()} />
                <DetailRow label="City/State" value={selectedApp.city_state} />
                <DetailRow label="Zip Code" value={selectedApp.zip_code} />
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-foreground">Background</h4>
                <DetailRow label="Worked Here Before" value={selectedApp.worked_before} />
                {selectedApp.worked_before === 'Yes' && <DetailRow label="Details" value={selectedApp.worked_before_details} />}
                <DetailRow label="Work Authorization" value={selectedApp.work_authorization} />
                <DetailRow label="How Heard" value={selectedApp.how_heard} />
                <DetailRow label="Referral Name" value={selectedApp.referral_name} />
                <DetailRow label="Criminal Record" value={selectedApp.criminal_record} />
                {selectedApp.criminal_record === 'Yes' && <DetailRow label="Details" value={selectedApp.criminal_record_details} />}
                <DetailRow label="Licensing Disqualifiers" value={selectedApp.licensing_disqualifiers} />
                <DetailRow label="Discharged/Resigned for Cause" value={selectedApp.discharged} />
                {selectedApp.discharged === 'Yes' && <DetailRow label="Details" value={selectedApp.discharged_details} />}
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-foreground">Employment History</h4>
                <DetailRow label="Currently Employed" value={selectedApp.currently_employed} />
                {[1, 2, 3].map((n) => (
                  selectedApp[`emp${n}_name`] && (
                    <div key={n} className="mt-3 p-3 bg-muted/30 rounded-lg">
                      <p className="text-sm font-semibold mb-1">Employer #{n}: {selectedApp[`emp${n}_name`]}</p>
                      <DetailRow label="Phone" value={selectedApp[`emp${n}_phone`]} />
                      <DetailRow label="Address" value={`${selectedApp[`emp${n}_address`] || ''} ${selectedApp[`emp${n}_city`] || ''}`.trim()} />
                      <DetailRow label="Dates" value={`${selectedApp[`emp${n}_from_date`] || ''} – ${selectedApp[`emp${n}_to_date`] || ''}`} />
                      <DetailRow label="May Contact" value={selectedApp[`emp${n}_may_contact`]} />
                      <DetailRow label="Duties" value={selectedApp[`emp${n}_duties`]} />
                      <DetailRow label="Reason for Leaving" value={selectedApp[`emp${n}_reason`]} />
                    </div>
                  )
                ))}
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-foreground">Education</h4>
                <DetailRow label="Education Level" value={selectedApp.education_level} />
                <DetailRow label="Institution" value={selectedApp.institution} />
                <DetailRow label="Graduated" value={selectedApp.graduated} />
                <DetailRow label="Degrees" value={selectedApp.degrees} />
                <DetailRow label="Licenses" value={selectedApp.licenses} />
                <DetailRow label="Licensure Number" value={selectedApp.licensure_number} />
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-foreground">References</h4>
                {[1, 2, 3].map((n) => (
                  <div key={n} className="mt-2 p-3 bg-muted/30 rounded-lg">
                    <p className="text-sm font-semibold mb-1">Reference #{n}: {selectedApp[`ref${n}_first`]} {selectedApp[`ref${n}_last`]}</p>
                    <DetailRow label="Company" value={selectedApp[`ref${n}_company`]} />
                    <DetailRow label="Relationship" value={selectedApp[`ref${n}_relationship`]} />
                    <DetailRow label="Phone" value={selectedApp[`ref${n}_phone`]} />
                    <DetailRow label="Email" value={selectedApp[`ref${n}_email`]} />
                    <DetailRow label="Years Known" value={selectedApp[`ref${n}_years_known`]} />
                  </div>
                ))}
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-foreground">Applicant Statement</h4>
                <DetailRow label="Statement Agreed" value={selectedApp.statement_agreed} />
                <DetailRow label="Signature" value={`${selectedApp.signature_first || ''} ${selectedApp.signature_last || ''}`.trim()} />
                <DetailRow label="Submitted" value={selectedApp.created ? new Date(selectedApp.created).toLocaleString() : null} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete the application from <strong>{selectedApp?.first_name} {selectedApp?.last_name}</strong>? This action cannot be undone.</p>
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

export default AdminJobApplicationsPage;
