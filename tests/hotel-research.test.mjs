import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const worker = read("../worker.js");
const cases = JSON.parse(read("./hotel-research-cases.json"));

test("general chatbot routes hotel questions through live web search and returns source metadata", () => {
  assert.ok(worker.includes("const hotelIntent=/\\b"), "Hotel routing must use real regex word boundaries");
  assert.ok(worker.includes("booking\\.com"), "Booking.com matching must escape the dot, not the backslash");
  assert.match(worker, /type:"web_search"/);
  assert.match(worker, /return json\(\{reply,sources,researchedAt:new Date\(\)\.toISOString\(\),sourceCount:sources\.length\}\)/);
});

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
  assert.match(worker, /url\.startsWith\("https:\/\/"\)/);
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


test("family chatbot persists shared messages and retrieves authenticated history", () => {
  assert.match(worker, /\/api\/chat\/history/);
  assert.match(worker, /currentUser\(request,env\)/);
  assert.match(worker, /INSERT INTO trip_chat_messages/);
  assert.match(worker, /SELECT role,content,created_at FROM trip_chat_messages ORDER BY id DESC LIMIT 20/);
});

test("family chatbot compacts older exchanges into a rolling summary", () => {
  assert.match(worker, /async function compactSharedChatMemory/);
  assert.match(worker, /count<=20/);
  assert.match(worker, /UPDATE trip_chat_summary SET summary=/);
  assert.match(worker, /DELETE FROM trip_chat_messages WHERE id<=\?/);
});

test("family chatbot restores summary, recent messages and saved research sources", () => {
  assert.match(worker, /summary:context\.summary/);
  assert.match(worker, /sources:JSON\.parse\(x\.sources_json\|\|"\[\]"\)/);
  assert.match(worker, /Conversation context \(use only to resolve references and preferences\)/);
});

test("chat memory migration creates non-destructive conversation and summary tables", () => {
  const migration = read("../migrations/0003_shared_chat_memory.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS trip_chat_messages/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS trip_chat_summary/);
  assert.match(migration, /INSERT OR IGNORE INTO trip_chat_summary/);
});


test("chat history and rolling summaries are isolated by authenticated username", () => {
  assert.match(worker, /getUserChatContext\(env,user\.username\)/);
  assert.match(worker, /saveUserChatMessage\(env,user\.username/);
  assert.match(worker, /WHERE username=\? ORDER BY id DESC LIMIT 20/);
  assert.match(worker, /WHERE username=\? ORDER BY id ASC LIMIT \?/);
  assert.match(worker, /DELETE FROM trip_chat_messages WHERE username=\? AND id<=\?/);
  assert.match(worker, /SELECT role,content,sources_json,created_at FROM trip_chat_messages WHERE username=\?/);
});

test("per-user chat summary migration matches the worker schema", () => {
  const migration = read("../migrations/0004_user_chat_summary.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS trip_chat_user_summary/);
  assert.match(migration, /username TEXT PRIMARY KEY/);
  assert.match(migration, /ON trip_chat_messages\(username, id DESC\)/);
});
