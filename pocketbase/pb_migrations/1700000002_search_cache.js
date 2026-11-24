/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  try {
    app.findCollectionByNameOrId("search_cache");
  } catch (_) {
    const col = new Collection({
      name: "search_cache",
      type: "base",
      listRule: null,
      viewRule: null,
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "query_norm", type: "text", required: true },
        { name: "fetched_at", type: "number", required: true },
        { name: "ac_count", type: "number" }
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_search_cache_query_norm ON search_cache (query_norm)"
      ]
    });
    app.save(col);
  }
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("search_cache"));
  } catch (_) {}
});
