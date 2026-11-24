import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

test("PocketBase hook uses exact root /{$} route (never catch-all '/' that breaks /assets/*)", () => {
  const hookSrc = fs.readFileSync(path.join(ROOT, "pocketbase", "pb_hooks", "main.pb.js"), "utf8");
  assert.ok(
    !/routerAdd\(\s*["']GET["']\s*,\s*["']\/["']\s*,/.test(hookSrc),
    "FATAL: routerAdd('GET', '/', ...) hijacks /assets/*.js and /assets/*.css in Go ServeMux! Use '/{$}' instead."
  );
  assert.ok(
    /routerAdd\(\s*["']GET["']\s*,\s*["']\/\{\$\}["']\s*,/.test(hookSrc),
    "Expected exact root route routerAdd('GET', '/{$}', ...) in main.pb.js"
  );
  assert.ok(
    !/\bonServe\s*\(/.test(hookSrc),
    "onServe() is not supported in PocketBase v0.40 JS hooks — use onBootstrap() instead."
  );
});

test("index.html includes explicit Open Graph & Twitter Card tags and fallback og-passport.jpg exists", () => {
  const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  assert.match(html, /property="og:image"\s+content="https:\/\/ns-running-results\.opensrc\.mx\/og-passport\.jpg"/);
  assert.match(html, /property="og:image:secure_url"/);
  assert.match(html, /property="og:title"/);
  assert.match(html, /property="og:description"/);
  assert.match(html, /name="twitter:card"\s+content="summary_large_image"/);

  const ogImgPath = path.join(ROOT, "public", "og-passport.jpg");
  assert.ok(fs.existsSync(ogImgPath), "public/og-passport.jpg must exist");
  assert.ok(fs.statSync(ogImgPath).size > 10000, "public/og-passport.jpg looks too small");
});

test("All PocketBase hook and migration files are syntactically valid JavaScript", () => {
  const migDir = path.join(ROOT, "pocketbase", "pb_migrations");
  const files = [
    path.join(ROOT, "pocketbase", "pb_hooks", "main.pb.js"),
    ...fs
      .readdirSync(migDir)
      .filter((f) => f.endsWith(".js"))
      .map((f) => path.join(migDir, f))
  ];
  for (const file of files) {
    const src = fs.readFileSync(file, "utf8");
    assert.doesNotThrow(() => new Function(src), `Syntax error in ${path.basename(file)}`);
  }
});
