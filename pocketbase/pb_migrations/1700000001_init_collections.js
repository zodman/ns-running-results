/// <reference path="../pb_data/types.d.ts" />

migrate((app) => {
  // 1. race_results collection
  try {
    app.findCollectionByNameOrId("race_results");
  } catch (_) {
    const raceResults = new Collection({
      name: "race_results",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "unique_key", type: "text", required: true },
        { name: "source", type: "text", required: true },
        { name: "participant", type: "text", required: true },
        { name: "participant_norm", type: "text" },
        { name: "event_name", type: "text", required: true },
        { name: "sub_event", type: "text" },
        { name: "race_date", type: "text" },
        { name: "city", type: "text" },
        { name: "rank", type: "text" },
        { name: "gun_time", type: "text" },
        { name: "chip_time", type: "text" },
        { name: "division", type: "text" },
        { name: "result_url", type: "text" },
        { name: "logo_url", type: "text" },
        { name: "event_slug", type: "text" }
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_race_results_unique_key ON race_results (unique_key)",
        "CREATE INDEX idx_race_results_participant_norm ON race_results (participant_norm)"
      ]
    });
    app.save(raceResults);
  }

  // 2. event_logos collection
  try {
    app.findCollectionByNameOrId("event_logos");
  } catch (_) {
    const eventLogos = new Collection({
      name: "event_logos",
      type: "base",
      listRule: "",
      viewRule: "",
      createRule: null,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: "slug", type: "text", required: true },
        { name: "logo_url", type: "text" }
      ],
      indexes: [
        "CREATE UNIQUE INDEX idx_event_logos_slug ON event_logos (slug)"
      ]
    });
    app.save(eventLogos);
  }
}, (app) => {
  try {
    app.delete(app.findCollectionByNameOrId("race_results"));
  } catch (_) {}
  try {
    app.delete(app.findCollectionByNameOrId("event_logos"));
  } catch (_) {}
});
