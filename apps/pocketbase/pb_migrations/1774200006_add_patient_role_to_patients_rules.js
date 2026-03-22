/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("patients");
  // Allow patient role to view their own record (user_id = @request.auth.id)
  collection.listRule = "@request.auth.role = 'admin' || @request.auth.role = 'caregiver' || @request.auth.role = 'family' || (@request.auth.role = 'patient' && user_id = @request.auth.id)";
  collection.viewRule = "@request.auth.role = 'admin' || @request.auth.role = 'caregiver' || @request.auth.role = 'family' || (@request.auth.role = 'patient' && user_id = @request.auth.id)";
  collection.createRule = "@request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'admin'";
  collection.deleteRule = "@request.auth.role = 'admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("patients");
  collection.listRule = "@request.auth.role = 'admin' || @request.auth.role = 'caregiver' || @request.auth.role = 'family'";
  collection.viewRule = "@request.auth.role = 'admin' || @request.auth.role = 'caregiver' || @request.auth.role = 'family'";
  collection.createRule = "@request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'admin'";
  collection.deleteRule = "@request.auth.role = 'admin'";
  return app.save(collection);
})
