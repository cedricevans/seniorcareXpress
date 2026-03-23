/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2605467279")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2605467279")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.id != \"\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "listRule": "@request.auth.id != \"\" && (sender_id = @request.auth.id || recipient_id = @request.auth.id)",
    "updateRule": "sender_id = @request.auth.id",
    "viewRule": "@request.auth.id != \"\" && (sender_id = @request.auth.id || recipient_id = @request.auth.id)"
  }, collection)

  return app.save(collection)
})
