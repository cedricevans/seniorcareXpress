/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Link patient@seniorcare.com user to the "John Smith" patient record
  try {
    const patientUser = app.findFirstRecordByFilter("users", "email='patient@seniorcare.com'");
    const patientRecord = app.findFirstRecordByFilter("patients", "name='John Smith'");
    if (patientUser && patientRecord) {
      patientRecord.set("user_id", patientUser.id);
      app.save(patientRecord);
    }
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      console.log("Patient user or record not found, skipping");
      return;
    }
    throw e;
  }
}, (app) => {
  try {
    const patientRecord = app.findFirstRecordByFilter("patients", "name='John Smith'");
    if (patientRecord) {
      patientRecord.set("user_id", "");
      app.save(patientRecord);
    }
  } catch (e) {
    if (e.message.includes("no rows in result set")) return;
    throw e;
  }
})
