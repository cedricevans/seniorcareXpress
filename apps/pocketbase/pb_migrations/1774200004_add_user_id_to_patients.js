/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  // Add user_id field to patients collection so patients can log in and see their own data
  const patientsCollection = app.findCollectionByNameOrId("patients");
  const usersCollection = app.findCollectionByNameOrId("users");

  // Check if user_id field already exists
  const existing = patientsCollection.fields.getByName("user_id");
  if (existing) return; // already migrated

  const field = new RelationField({
    name: "user_id",
    required: false,
    cascadeDelete: false,
    collectionId: usersCollection.id,
    maxSelect: 1,
    minSelect: 0,
  });

  patientsCollection.fields.add(field);
  return app.save(patientsCollection);
}, (app) => {
  const patientsCollection = app.findCollectionByNameOrId("patients");
  patientsCollection.fields.removeByName("user_id");
  return app.save(patientsCollection);
})
