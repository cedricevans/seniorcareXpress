/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("patient_assignments");

  const record0 = new Record(collection);
    const record0_patient_idLookup = app.findFirstRecordByFilter("patients", "name='John Smith'");
    if (!record0_patient_idLookup) { throw new Error("Lookup failed for patient_id: no record in 'patients' matching \"name='John Smith'\""); }
    record0.set("patient_id", record0_patient_idLookup.id);
    const record0_caregiver_idLookup = app.findFirstRecordByFilter("users", "email='caregiver@seniorcare.com'");
    if (!record0_caregiver_idLookup) { throw new Error("Lookup failed for caregiver_id: no record in 'users' matching \"email='caregiver@seniorcare.com'\""); }
    record0.set("caregiver_id", record0_caregiver_idLookup.id);
    record0.set("start_date", "2026-03-21");
    record0.set("status", "active");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }
}, (app) => {
  // Rollback: record IDs not known, manual cleanup needed
})
