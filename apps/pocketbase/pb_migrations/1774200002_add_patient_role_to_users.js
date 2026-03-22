/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");

  // Update role field to include 'patient'
  const roleField = collection.fields.getByName("role");
  if (roleField && roleField.type === "select") {
    roleField.values = ["admin", "caregiver", "family", "patient"];
    collection.fields.add(roleField);
  }

  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  const roleField = collection.fields.getByName("role");
  if (roleField && roleField.type === "select") {
    roleField.values = ["admin", "caregiver", "family"];
    collection.fields.add(roleField);
  }
  return app.save(collection);
})
