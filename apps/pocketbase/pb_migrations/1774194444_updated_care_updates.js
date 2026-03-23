/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_1387383043")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select1488060598",
    "maxSelect": 1,
    "name": "update_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "vitals",
      "medication",
      "feeding",
      "bathing",
      "grooming",
      "toileting",
      "exercise",
      "mobility",
      "sleep",
      "mood",
      "social_activity",
      "incident",
      "general"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_1387383043")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"admin\" || @request.auth.role = \"caregiver\"",
    "deleteRule": "@request.auth.role = \"admin\"",
    "listRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.role = \"admin\" || caregiver_id = @request.auth.id",
    "viewRule": "@request.auth.id != \"\""
  }, collection)

  // update field
  collection.fields.addAt(3, new Field({
    "hidden": false,
    "id": "select1488060598",
    "maxSelect": 1,
    "name": "update_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "vitals",
      "medication",
      "activity",
      "incident",
      "general"
    ]
  }))

  return app.save(collection)
})
