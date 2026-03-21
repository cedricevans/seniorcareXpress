/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("appointments");

  const record0 = new Record(collection);
    const record0_patient_idLookup = app.findFirstRecordByFilter("patients", "name='John Smith'");
    if (!record0_patient_idLookup) { throw new Error("Lookup failed for patient_id: no record in 'patients' matching \"name='John Smith'\""); }
    record0.set("patient_id", record0_patient_idLookup.id);
    const record0_caregiver_idLookup = app.findFirstRecordByFilter("users", "email='caregiver@seniorcare.com'");
    if (!record0_caregiver_idLookup) { throw new Error("Lookup failed for caregiver_id: no record in 'users' matching \"email='caregiver@seniorcare.com'\""); }
    record0.set("caregiver_id", record0_caregiver_idLookup.id);
    record0.set("appointment_date", "2026-03-24");
    record0.set("appointment_time", "10:00 AM");
    record0.set("status", "scheduled");
  try {
    app.save(record0);
  } catch (e) {
    if (e.message.includes("Value must be unique")) {
      console.log("Record with unique value already exists, skipping");
    } else {
      throw e;
    }
  }

  const record1 = new Record(collection);
    const record1_patient_idLookup = app.findFirstRecordByFilter("patients", "name='John Smith'");
    if (!record1_patient_idLookup) { throw new Error("Lookup failed for patient_id: no record in 'patients' matching \"name='John Smith'\""); }
    record1.set("patient_id", record1_patient_idLookup.id);
    const record1_caregiver_idLookup = app.findFirstRecordByFilter("users", "email='caregiver@seniorcare.com'");
    if (!record1_caregiver_idLookup) { throw new Error("Lookup failed for caregiver_id: no record in 'users' matching \"email='caregiver@seniorcare.com'\""); }
    record1.set("caregiver_id", record1_caregiver_idLookup.id);
    record1.set("appointment_date", "2026-03-28");
    record1.set("appointment_time", "2:00 PM");
    record1.set("status", "scheduled");
  try {
    app.save(record1);
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
