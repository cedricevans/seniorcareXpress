/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  try {
    const record = app.findFirstRecordByFilter("users", "email='patient@seniorcare.com'");
    record.set("role", "patient");
    return app.save(record);
  } catch (e) {
    if (e.message.includes("no rows in result set")) {
      // User doesn't exist yet — create it
      const collection = app.findCollectionByNameOrId("users");
      const record = new Record(collection);
      record.set("email", "patient@seniorcare.com");
      record.setPassword("Admin123!");
      record.set("name", "Patient Demo");
      record.set("role", "patient");
      record.set("emailVisibility", true);
      return app.save(record);
    }
    throw e;
  }
}, (app) => {
  try {
    const record = app.findFirstRecordByFilter("users", "email='patient@seniorcare.com'");
    record.set("role", "family");
    return app.save(record);
  } catch (e) {
    if (e.message.includes("no rows in result set")) return;
    throw e;
  }
})
