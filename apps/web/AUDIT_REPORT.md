
# Portal Codebase Audit Report
**Date:** 2026-03-21

## 1. Broken Buttons (Missing or Ineffective onClick Handlers)
*   **AdminPatientList.jsx:** 
    *   `View Profile` button in the table rows has no `onClick` handler.
*   **AdminCaregiverList.jsx:** 
    *   `Invite Caregiver` button in the header has no `onClick` handler.
    *   `Manage` button in the table rows has no `onClick` handler.
*   **CaregiverDashboard.jsx:** 
    *   `View Details` button on the "Today's Appointments" list has no `onClick` handler.
*   **CaregiverPatientList.jsx:** 
    *   `Log Care Update` button on the patient cards has no `onClick` handler.
*   **PortalHeader.jsx:** 
    *   `Globe` (Language) button has no handler.
    *   `Bell` (Notifications) button has no handler.
    *   `Profile Settings` and `Preferences` dropdown items have no handlers.
*   **AppointmentCalendar.jsx:**
    *   Events are displayed, but clicking them does nothing (missing `onSelectEvent` handler to view details).

## 2. Missing Data Fetches & Display Issues
*   **AdminCaregiverList.jsx:** 
    *   Currently only fetches the user record. It does not fetch or display the number of assigned patients or active schedules for each caregiver.
*   **PatientDashboard.jsx:** 
    *   *Architectural Issue:* Currently uses `family_links` as a proxy to find the linked patient record for a logged-in patient. A user with the `patient` role should ideally have a direct link to their `patients` record (e.g., via a `patient_users` collection or matching email), rather than relying on the family proxy table.
*   **FamilyDashboard.jsx:**
    *   Care logs are fetched, but documents/files attached to encounters are not explicitly fetched or displayed in the Medical Records tab.

## 3. Broken or Missing Forms
*   **AdminCaregiverList.jsx:** 
    *   Missing the form to actually create/invite a new caregiver (unlike the Patient list which has a working Add Patient dialog).
*   **AdminPatientList.jsx:** 
    *   Has a working "Add" form, but is completely missing "Edit" and "Delete" forms/functionality.
*   **CaregiverEncounterForm.jsx & CaregiverCareNotesForm.jsx:**
    *   Forms work and save to the database, but there is no UI to view the submitted notes/encounters immediately after submission within the same tab context (requires navigating to a different view or relying on the family/patient portal to see them).

## 4. Broken Navigation & Routing Inconsistencies
*   **App.jsx vs Dashboards:** 
    *   The sidebar navigation (`PortalSidebar.jsx`) links to separate routes like `/admin/patients` and `/admin/caregivers`.
    *   However, in `App.jsx`, these routes render a `<PlaceholderPage />`.
    *   The actual functionality for Patients and Caregivers was built into `Tabs` inside `AdminDashboard.jsx` (`/admin`). This creates a confusing UX where clicking the sidebar goes to a placeholder, but the functionality exists hidden inside dashboard tabs.
    *   *Same issue applies to Caregiver, Family, and Patient portals.* Sidebar links go to placeholders, while the main dashboard uses Tabs.

## 5. Authentication & Role Management Issues
*   **AuthContext.jsx & LoginPage.jsx:** 
    *   Working correctly. Role detection (`authData.record.role`) successfully routes users to their respective dashboards.
    *   `ProtectedRoute.jsx` correctly prevents unauthorized access.
*   **Role Data Integrity:** 
    *   The system assumes `currentUser.role` perfectly aligns with the collections. However, if an admin creates a user without setting the role properly, the portal will fallback to the home page.

## 6. API / Database Connection Issues
*   **PocketBase Client:** 
    *   All `pb.collection().getFullList()` and `create()` calls are correctly using `{$autoCancel: false}`.
*   **CaregiverEncounterForm.jsx:** 
    *   File uploads are correctly using `FormData` to append `documents`. This is implemented perfectly for PocketBase.
*   **Date Filtering:** 
    *   `AdminDashboard.jsx` and `CaregiverDashboard.jsx` use string comparison for dates (`appointment_date >= "2026-03-21"`). This works for PocketBase datetime fields, but could miss timezone nuances if not careful.

## 7. What IS Working Correctly
*   **Authentication Flow:** Login, logout, and protected route wrappers are fully functional.
*   **Database Writes:** Adding a patient (Admin), scheduling an appointment (Admin/Caregiver), logging an encounter (Caregiver), and adding care notes (Caregiver) all successfully write to the PocketBase database.
*   **Calendar Integration:** `react-big-calendar` is correctly parsing PocketBase date/time strings and rendering events with color-coding based on status.
*   **UI/UX Components:** The shadcn/ui components (Tabs, Cards, Dialogs, Selects) are rendering beautifully with the custom Tailwind design tokens.
*   **Relational Data:** `expand` is being used correctly across the board to fetch related patient and caregiver names for appointments and care logs.
