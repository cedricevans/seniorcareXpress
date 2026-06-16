/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("users")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"admin\"",
    "listRule": "@request.auth.id != \"\""
  }, collection)

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("users")

  // update collection data
  unmarshal({
    "createRule": null,
    "listRule": "@request.auth.id != \"\" && (@request.auth.role = \"admin\" || @request.auth.id = id)"
  }, collection)

  return app.save(collection)
})
