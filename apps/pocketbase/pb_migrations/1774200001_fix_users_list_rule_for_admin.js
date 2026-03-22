/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users");
  // Allow admins to list all users, users can only see themselves
  collection.listRule = "@request.auth.role = 'admin' || id = @request.auth.id";
  collection.viewRule = "@request.auth.role = 'admin' || id = @request.auth.id";
  collection.createRule = "@request.auth.role = 'admin'";
  collection.updateRule = "@request.auth.role = 'admin' || id = @request.auth.id";
  collection.deleteRule = "@request.auth.role = 'admin'";
  return app.save(collection);
}, (app) => {
  const collection = app.findCollectionByNameOrId("users");
  collection.listRule = "id = @request.auth.id";
  collection.viewRule = "id = @request.auth.id";
  collection.createRule = "";
  collection.updateRule = "id = @request.auth.id";
  collection.deleteRule = "id = @request.auth.id";
  return app.save(collection);
})
