import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, X } from 'lucide-react';
import { toast } from 'sonner';

// Shown at the top of each VA form page. Lets staff either start a blank form
// or import a previously-saved veteran/claimant profile (a va_cases record)
// so they don't retype the same identity data on every form.
export default function VaCaseProfilePicker({ cases, loadingCases, importedCaseId, onImport, onClear, importNote }) {
  const importedCase = cases.find((c) => c.id === importedCaseId);

  const handleSelect = (caseId) => {
    const caseRecord = cases.find((c) => c.id === caseId);
    if (!caseRecord) return;
    onImport(caseRecord);
    toast.success(`Imported profile for ${caseRecord.first_name} ${caseRecord.last_name}`);
  };

  return (
    <div className="mb-8 bg-slate-50 border border-slate-200 rounded-md p-4">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4 text-primary" />
        <Label className="text-sm font-semibold">Veteran / Claimant Profile</Label>
      </div>

      {importedCase ? (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-md px-3 py-2">
          <span className="text-sm">
            Using saved profile: <strong>{importedCase.first_name} {importedCase.last_name}</strong>
          </span>
          <button
            type="button"
            onClick={onClear}
            className="text-slate-400 hover:text-red-500 text-sm flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Clear
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <Select onValueChange={handleSelect} disabled={loadingCases || cases.length === 0}>
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder={loadingCases ? 'Loading profiles…' : cases.length === 0 ? 'No saved profiles yet' : 'Import an existing profile…'} />
            </SelectTrigger>
            <SelectContent>
              {cases.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.first_name} {c.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-slate-400">or fill in a new profile below</span>
        </div>
      )}

      {importNote && (
        <p className="text-xs text-slate-500 mt-3">{importNote}</p>
      )}
    </div>
  );
}
