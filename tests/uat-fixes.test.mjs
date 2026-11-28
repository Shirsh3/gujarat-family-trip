import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../index.html");
const worker = read("../worker.js");

test("AI requests use bounded retries, timeout and Retry-After handling", () => {
  assert.match(worker, /async function fetchOpenAIResponse\(key,payload,maxRetries=2\)/);
  assert.match(worker, /AbortSignal\.timeout\(45000\)/);
  assert.match(worker, /response\.headers\.get\("Retry-After"\)/);
  assert.match(worker, /\[408,429,500,502,503,504\]/);
  assert.equal((worker.match(/fetchOpenAIResponse\(key,payload\)/g) || []).length, 2);
});

test("transient AI errors are reported as retryable rather than generic hard failures", () => {
  assert.match(worker, /retryable:\[408,429,500,502,503,504\]/);
  assert.match(worker, /temporarily busy after retries/);
  assert.match(worker, /retryable:true/);
});

test("family UI exposes sign out and calls the existing logout endpoint", () => {
  assert.match(html, /id="sign-out-btn"/);
  assert.match(html, /fetch\('\/api\/auth\/logout'/);
  assert.match(html, /location\.replace\('\/login\.html'\)/);
});

test("Laxmi Niwas toddler admission remains unconfirmed until user records written confirmation", () => {
  assert.match(html, /Toddler admission: written confirmation required/);
  assert.match(html, /Written confirmation received/);
  assert.match(html, /gujarat-child-policy:/);
  assert.match(html, /Do not rely on this hotel/);
});

test("broken Hawthorn factsheet URL is no longer presented as a working link", () => {
  assert.doesNotMatch(html, /href="https:\/\/hawthorndwarka\.com\/wp-content\/uploads\/2026\/04\/Factsheet-Hawthorn-Suites-By-Wyndham-Dwarka\.pdf"/);
  assert.match(html, /Hawthorn factsheet · unavailable/);
});

test("chatbot can close on outside click and Escape", () => {
  assert.match(html, /document\.addEventListener\('pointerdown'/);
  assert.match(html, /event\.key==='Escape'/);
});

test("train cards are cross-linked from Getting Around without fabricating unavailable times", () => {
  for (const train of ["20938","20937","15013","12983"]) {
    assert.match(html, new RegExp('id="train-' + train + '"'));
    assert.match(html, new RegExp('href="#train-' + train + '"'));
  }
  assert.match(html, /20937 departure and arrival times are not available in the saved ERS details/);
});

test("Getting Around explains the Bet Dwarka ferry separately from road legs", () => {
  assert.match(html, /Bet Dwarka ferry/);
  assert.match(html, /separate transfer/);
  assert.match(html, /No ferry departure time, fare or availability is confirmed/);
});

test("AI and hotel research failures provide user-facing retry actions", () => {
  assert.match(html, /Retry this question/);
  assert.match(html, /Retry search/);
});


test("all AI routes use GPT-4o mini and never route requests to Astra", () => {
  assert.doesNotMatch(worker, /gpt-6\\.2-astra|gpt-4\\.1-mini/);
  assert.equal((worker.match(/model:"gpt-4o-mini"/g) || []).length, 3);
  assert.match(worker, /hotelResearchPrompt/);
  assert.match(worker, /async function callAI/);
});


test("map uses the current Government of India BharatMapService boundary layer", () => {
  assert.match(html, /esri-leaflet@3\.0\.15/);
  assert.match(html, /mapservice\.gov\.in\/gismapservice\/rest\/services\/BharatMapService\/Admin_Boundary_District\/MapServer\/0/);
  assert.match(html, /L\.esri\.featureLayer/);
  assert.doesNotMatch(html, /tile\.openstreetmap\.org/);
  assert.doesNotMatch(html, /IND_AdminBoundary\/FeatureServer\/0/);
  assert.doesNotMatch(html, /color:'#9b1c1c'/);
});


test("trip map uses India-only government state boundaries without a world basemap or red overlay", () => {
  assert.match(html, /mapservice\.gov\.in\/gismapservice\/rest\/services\/BharatMapService\/Admin_Boundary_District\/MapServer\/0/);
  assert.match(html, /L\.esri\.featureLayer/);
  assert.doesNotMatch(html, /tile\.openstreetmap\.org/);
  assert.doesNotMatch(html, /IND_AdminBoundary\/FeatureServer\/0/);
  assert.doesNotMatch(html, /color:'#9b1c1c'/);
  assert.match(html, /map\.fitBounds\(\[\[6\.5,68\.0\],\[37\.5,98\.5\]\]/);
});
