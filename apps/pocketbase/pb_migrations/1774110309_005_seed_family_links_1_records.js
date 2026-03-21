/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("family_links");

  const record0 = new Record(collection);
    const record0_patient_idLookup = app.findFirstRecordByFilter("patients", "name='John Smith'");
    if (!record0_patient_idLookup) { throw new Error("Lookup failed for patient_id: no record in 'patients' matching \"name='John Smith'\""); }
    record0.set("patient_id", record0_patient_idLookup.id);
    const record0_family_user_idLookup = app.findFirstRecordByFilter("users", "email='family@seniorcare.com'");
    if (!record0_family_user_idLookup) { throw new Error("Lookup failed for family_user_id: no record in 'users' matching \"email='family@seniorcare.com'\""); }
    record0.set("family_user_id", record0_family_user_idLookup.id);
    record0.set("relationship", "other");
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
