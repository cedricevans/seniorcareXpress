/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("caregiver_notes");
  collection.listRule = "@request.auth.role = 'admin' || (@request.auth.role = 'caregiver' && caregiver_id = @request.auth.id)";
  collection.viewRule = "@request.auth.role = 'admin' || (@request.auth.role = 'caregiver' && caregiver_id = @request.auth.id)";
  collection.createRule = "@request.auth.role = 'caregiver'";
  collection.updateRule = "@request.auth.role = 'admin' || (@request.auth.role = 'caregiver' && caregiver_id = @request.auth.id)";
  collection.deleteRule = "@request.auth.role = 'admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("caregiver_notes");
  collection.listRule = "@request.auth.role = 'admin' || (@request.auth.role = 'caregiver' && caregiver_id = @request.auth.id)";
  collection.viewRule = "@request.auth.role = 'admin' || (@request.auth.role = 'caregiver' && caregiver_id = @request.auth.id)";
  collection.createRule = "@request.auth.role = 'caregiver'";
  collection.updateRule = "@request.auth.role = 'admin' || (@request.auth.role = 'caregiver' && caregiver_id = @request.auth.id)";
  collection.deleteRule = "@request.auth.role = 'admin'";
  return app.save(collection);
})
