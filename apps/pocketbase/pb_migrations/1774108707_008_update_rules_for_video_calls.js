/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("video_calls");
  collection.listRule = "@request.auth.role = 'admin' || @request.auth.role = 'caregiver' || @request.auth.role = 'family'";
  collection.viewRule = "@request.auth.role = 'admin' || @request.auth.role = 'caregiver' || @request.auth.role = 'family'";
  collection.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'family'";
  collection.updateRule = "@request.auth.role = 'admin'";
  collection.deleteRule = "@request.auth.role = 'admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("video_calls");
  collection.listRule = "@request.auth.role = 'admin' || @request.auth.role = 'caregiver' || @request.auth.role = 'family'";
  collection.viewRule = "@request.auth.role = 'admin' || @request.auth.role = 'caregiver' || @request.auth.role = 'family'";
  collection.createRule = "@request.auth.role = 'admin' || @request.auth.role = 'family'";
  collection.updateRule = "@request.auth.role = 'admin'";
  collection.deleteRule = "@request.auth.role = 'admin'";
  return app.save(collection);
})
