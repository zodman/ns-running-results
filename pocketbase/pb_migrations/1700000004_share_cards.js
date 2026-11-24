/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  try {
    app.findCollectionByNameOrId("share_cards");
  } catch (_) {
    const col = new Collection({
      name: "share_cards",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "runner_norm", type: "text", required: true },
        { name: "runner_name", type: "text" },
        { name: "summary", type: "text" },
        { name: "image_b64", type: "text", max: 5000000 },
        { name: "updated_ms", type: "number" }
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_share_cards_runner_norm ON share_cards (runner_norm)"
      ]
    });
    app.save(col);
  }
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("share_cards"));
  } catch (_) {}
});
