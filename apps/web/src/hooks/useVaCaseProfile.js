import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import pb from '@/lib/pocketbaseClient';

// Fields on va_cases that represent reusable identity data, shared across every
// VA form's field_map. Each form page only imports the subset it actually uses.
const CASE_IDENTITY_FIELDS = [
  'veteran_first_name', 'veteran_last_name', 'veteran_middle_initial',
  'veteran_ssn_first3', 'veteran_ssn_middle2', 'veteran_ssn_last4',
  'va_file_number', 'veteran_service_number',
  'veteran_dob_month', 'veteran_dob_day', 'veteran_dob_year',
  'claimant_first_name', 'claimant_last_name', 'claimant_middle_initial',
  'claimant_ssn_first3', 'claimant_ssn_middle2', 'claimant_ssn_last4',
  'claimant_va_file_number', 'claimant_dob_month', 'claimant_dob_day', 'claimant_dob_year',
  'mailing_address_street', 'mailing_address_apt', 'mailing_address_city',
  'mailing_address_state', 'mailing_address_country', 'mailing_address_zip5',
  'phone_area', 'phone_mid', 'phone_last4', 'email',
];

// Shared "start new / import existing" profile logic for the VA form pages.
// Each page still owns its own `values` state and its own list of case-level
// fields it cares about (`caseFields`) — this hook only handles listing
// va_cases records, loading one into a values object, and knowing whether the
// current values came from an import (so submit can update instead of create).
//
// If the page is opened with ?profile=<va_cases id> (e.g. from the VA Intake
// "which form does this person need?" panel), `autoImportCase` resolves to
// that profile once it loads, so the caller can auto-fill without staff
// having to reselect it from the picker dropdown.
export function useVaCaseProfile() {
  const [cases, setCases] = useState([]);
  const [loadingCases, setLoadingCases] = useState(true);
  const [importedCaseId, setImportedCaseId] = useState(null);
  const [searchParams] = useSearchParams();
  const autoImportRequestedId = searchParams.get('profile');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await pb.collection('va_cases').getFullList();
        if (!cancelled) setCases(list);
      } catch (err) {
        console.error('Failed to load VA case profiles', err);
      } finally {
        if (!cancelled) setLoadingCases(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const importCase = useCallback((caseRecord) => {
    setImportedCaseId(caseRecord.id);
    const imported = {};
    CASE_IDENTITY_FIELDS.forEach((key) => {
      if (caseRecord[key]) imported[key] = caseRecord[key];
    });
    return imported;
  }, []);

  const clearImport = useCallback(() => setImportedCaseId(null), []);

  const autoImportCase = !importedCaseId && autoImportRequestedId
    ? cases.find((c) => c.id === autoImportRequestedId) || null
    : null;

  return { cases, loadingCases, importedCaseId, importCase, clearImport, autoImportCase };
}

export { CASE_IDENTITY_FIELDS };
