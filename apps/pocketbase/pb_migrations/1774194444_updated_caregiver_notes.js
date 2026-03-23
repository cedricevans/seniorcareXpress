/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
  const collection = app.findCollectionByNameOrId("pbc_2683236183")

  // update collection data
  unmarshal({
    "createRule": null,
    "deleteRule": null,
    "listRule": null,
    "updateRule": null,
    "viewRule": null
  }, collection)

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select748963441",
    "maxSelect": 1,
    "name": "note_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "general",
      "medical",
      "behavioral",
      "nutrition",
      "feeding",
      "bathing",
      "grooming",
      "toileting",
      "exercise",
      "mobility",
      "sleep",
      "mood",
      "social_activity",
      "incident"
    ]
  }))

  return app.save(collection)
}, (app) => {
  const collection = app.findCollectionByNameOrId("pbc_2683236183")

  // update collection data
  unmarshal({
    "createRule": "@request.auth.role = \"caregiver\" || @request.auth.role = \"admin\"",
    "deleteRule": "@request.auth.role = \"admin\" || caregiver_id = @request.auth.id",
    "listRule": "@request.auth.id != \"\"",
    "updateRule": "@request.auth.role = \"admin\" || caregiver_id = @request.auth.id",
    "viewRule": "@request.auth.id != \"\""
  }, collection)

  // update field
  collection.fields.addAt(4, new Field({
    "hidden": false,
    "id": "select748963441",
    "maxSelect": 1,
    "name": "note_type",
    "presentable": false,
    "required": false,
    "system": false,
    "type": "select",
    "values": [
      "general",
      "medical",
      "behavioral",
      "nutrition",
      "activity"
    ]
  }))

  return app.save(collection)
})
