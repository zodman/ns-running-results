/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  try {
    app.findCollectionByNameOrId("opt_outs");
  } catch (_) {
    const col = new Collection({
      name: "opt_outs",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "participant_norm", type: "text", required: true },
        { name: "original_name", type: "text" }
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_opt_outs_participant_norm ON opt_outs (participant_norm)"
      ]
    });
    app.save(col);
  }
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("opt_outs"));
  } catch (_) {}
});
