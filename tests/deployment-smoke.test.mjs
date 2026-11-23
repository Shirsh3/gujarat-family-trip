import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const worker = read("../worker.js");
const html = read("../index.html");
const wrangler = JSON.parse(read("../wrangler.jsonc"));
const migrationUsers = read("../migrations/0002_trip_users.sql");
const migrationReviews = read("../migrations/0001_public_reviews.sql");

test("Wrangler keeps the production Worker and D1 binding", () => {
  assert.equal(wrangler.name, "gujarat-family-trip");
  assert.equal(wrangler.main, "./worker.js");
  assert.equal(wrangler.d1_databases[0].binding, "DB");
  assert.equal(wrangler.d1_databases[0].database_name, "gujarat-trip-reviews");
  assert.equal(wrangler.d1_databases[0].database_id, "6903edf4-e024-4bdd-b480-132362972180");
  assert.equal(wrangler.d1_databases[0].migrations_dir, "./migrations");
  assert.equal(wrangler.assets.binding, "ASSETS");
  assert.equal(wrangler.assets.run_worker_first, true);
});

test("existing authentication and health routes remain in place", () => {
  for (const route of ["/api/auth/login", "/api/auth/logout", "/api/auth/me", "/api/health", "/api/chat", "/api/hotels/search", "/api/trip/context"]) {
    assert.ok(worker.includes(route), `Missing route ${route}`);
  }
  assert.match(worker, /env\.SESSION_SECRET/);
  assert.match(worker, /env\.DB/);
  assert.match(worker, /databaseConnected/);
});

test("existing D1 migrations are non-destructive and repeat-safe", () => {
  assert.match(migrationUsers, /CREATE TABLE IF NOT EXISTS trip_users/i);
  assert.match(migrationReviews, /CREATE TABLE IF NOT EXISTS public_reviews/i);
  assert.doesNotMatch(migrationUsers, /DROP TABLE|DELETE FROM|TRUNCATE/i);
  assert.doesNotMatch(migrationReviews, /DROP TABLE|DELETE FROM|TRUNCATE/i);
});

test("main page retains essential trip features and has unique element IDs", () => {
  for (const feature of ["hotel-search-form", "hotel-review-search-form", "floating-chat-form", "trip-map", "checklist", "costs"]) {
    assert.ok(html.includes(`id="${feature}"`), `Missing feature ${feature}`);
  }
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], []);
});

test("public asset ignore excludes private source and migration files", () => {
  const ignore = read("../.assetsignore");
  for (const entry of ["worker.js", "wrangler.jsonc", "migrations/", "tests/"]) {
    assert.ok(ignore.includes(entry), `Missing asset exclusion ${entry}`);
  }
});
