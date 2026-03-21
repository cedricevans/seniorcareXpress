/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("patients");

  const record0 = new Record(collection);
    record0.set("name", "John Smith");
    record0.set("dob", "1948-03-21");
    record0.set("medical_conditions", "Hypertension, Diabetes");
    record0.set("emergency_contact", "john.smith@seniorcare.com");
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
