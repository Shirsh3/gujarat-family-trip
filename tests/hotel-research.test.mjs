import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const worker = read("../worker.js");
const cases = JSON.parse(read("./hotel-research-cases.json"));

test("hotel research instructions require exact-property matching and independent platform checks", () => {
  assert.match(worker, /Identify the exact property first/);
  for (const platform of ["Google Maps", "Tripadvisor", "Booking\.com", "Agoda"]) {
    assert.ok(worker.includes(platform), `Missing platform instruction: ${platform}`);
  }
});

test("hotel research rules prohibit invented ratings, counts, dates and availability", () => {
  assert.match(worker, /Do not invent quotations, ratings, counts, dates, prices, amenities, hotel identity, or availability/);
  assert.match(worker, /never average scores or transfer a score from one platform to another/i);
  assert.match(worker, /actual review is visible/);
  assert.match(worker, /Mark each missing field 'Not verified'/);
});

test("hotel research response returns timestamp and deduplicated direct HTTP source links", () => {
  assert.match(worker, /researchedAt:new Date\(\)\.toISOString\(\)/);
  assert.match(worker, /sourceCount:sources\.length/);
  assert.match(worker, /!\^https\?:/);
  assert.match(worker, /sources\.some\(x=>x\.url===url\)/);
});

test("ten manual hotel research evaluation scenarios are complete and uniquely identified", () => {
  assert.equal(cases.length, 10);
  assert.equal(new Set(cases.map((item) => item.id)).size, 10);
  for (const item of cases) {
    assert.match(item.id, /^H\d{2}$/);
    assert.ok(item.question.length > 30, `Question ${item.id} is too short`);
    assert.ok(Array.isArray(item.checks) && item.checks.length >= 3, `Question ${item.id} needs evaluation checks`);
  }
});

test("evaluation scenarios cover ratings, dates, property identity, family fit, price and source quality", () => {
  const allChecks = new Set(cases.flatMap((item) => item.checks));
  for (const expected of [
    "platform_by_platform_ratings",
    "actual_review_dates_only",
    "identity_disambiguation",
    "family_suitability_evidence",
    "dated_price_source",
    "direct_sources",
    "no_fabricated_ratings",
    "clear_limitations"
  ]) assert.ok(allChecks.has(expected), `Missing evaluation coverage: ${expected}`);
});
