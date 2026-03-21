/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("medical_history");

  const record0 = new Record(collection);
    const record0_patient_idLookup = app.findFirstRecordByFilter("patients", "name='John Smith'");
    if (!record0_patient_idLookup) { throw new Error("Lookup failed for patient_id: no record in 'patients' matching \"name='John Smith'\""); }
    record0.set("patient_id", record0_patient_idLookup.id);
    record0.set("condition_name", "Hypertension");
    record0.set("diagnosis_date", "2015-01-15");
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

  const record1 = new Record(collection);
    const record1_patient_idLookup = app.findFirstRecordByFilter("patients", "name='John Smith'");
    if (!record1_patient_idLookup) { throw new Error("Lookup failed for patient_id: no record in 'patients' matching \"name='John Smith'\""); }
    record1.set("patient_id", record1_patient_idLookup.id);
    record1.set("condition_name", "Arthritis");
    record1.set("diagnosis_date", "2018-06-20");
    record1.set("status", "active");
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
