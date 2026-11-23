import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { JSDOM } from "jsdom";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const html = read("../index.html");
const worker = read("../worker.js");
const markdownSrc = read("../markdown.js");

test("thinkHarder is defined inside the submit handler from #chat-depth", () => {
  assert.match(html, /id="chat-depth"/);
  assert.match(html, /function readThinkHarder/);
  assert.match(html, /const thinkHarder=readThinkHarder\('chat-depth'\)/);
  assert.match(html, /JSON\.stringify\(\{message:q,thinkHarder:!!thinkHarder\}\)/);
  const submitIdx = html.indexOf("floating-chat-form').addEventListener('submit'");
  const defineIdx = html.indexOf("const thinkHarder=readThinkHarder('chat-depth')");
  const payloadIdx = html.indexOf("thinkHarder:!!thinkHarder");
  assert.ok(submitIdx > 0 && defineIdx > submitIdx && payloadIdx > defineIdx);
});

test("chat send button selector ignores the voice-mic button", () => {
  assert.match(html, /form\.querySelector\('button\.btn\[type="submit"\]'\)/);
});

test("worker treats thinkHarder as a boolean and changes tool/token limits", () => {
  assert.match(worker, /const thinkHarder=body\.thinkHarder===true/);
  assert.match(worker, /max_tool_calls:thinkHarder\?8:4/);
  assert.match(worker, /max_output_tokens:thinkHarder\?1300:/);
  assert.match(worker, /mode:thinkHarder\?"deep":"quick"/);
});

test("hotel search accepts thinkHarder and uses shared research prompt rules", () => {
  assert.match(worker, /hotelResearchPrompt\(/);
  assert.match(worker, /Anand Chowk/);
  assert.match(worker, /under-18/);
  assert.match(worker, /Exact listing verified\?/);
});

test("trip context endpoint exists and matches structured hotels", () => {
  assert.match(worker, /url\.pathname==="\/api\/trip\/context"/);
  assert.match(worker, /Hotel Laxmi Niwas/);
  assert.match(worker, /Anand Chowk, Dwarka/);
});

test("expense tracker supports add/remove and username-scoped storage", () => {
  assert.match(html, /id="add-expense-form"/);
  assert.match(html, /expense-remove/);
  assert.match(html, /gujarat-trip-expenses-v1:'\+d\.user\.username/);
  assert.equal((html.match(/gujarat-trip-extra-expenses-v1/g) || []).length, 0);
});

function loadTripMarkdown(dom) {
  const script = dom.window.document.createElement("script");
  script.textContent = markdownSrc;
  dom.window.document.body.appendChild(script);
  assert.ok(dom.window.TripMarkdown, "TripMarkdown should attach to window");
  return dom.window.TripMarkdown;
}

test("shared markdown renderer bold/table/link behaviour", () => {
  const dom = new JSDOM("<!doctype html><body><div id='out'></div></body>", { runScripts: "dangerously" });
  const { renderMarkdown } = loadTripMarkdown(dom);
  const out = dom.window.document.getElementById("out");
  renderMarkdown(
    out,
    [
      "**Exact property: Hotel Laxmi Niwas**",
      "",
      "*Italic text*",
      "",
      "- First item",
      "1. First step",
      "",
      "[Source](https://example.com/hotel)",
      "",
      "| Platform | Rating | Reviews |",
      "| --- | --- | --- |",
      "| Google | Not verified | Not verified |",
    ].join("\n"),
  );
  assert.ok(out.querySelectorAll("strong").length >= 1);
  assert.equal(out.textContent.includes("**Exact property"), false);
  assert.ok(out.querySelector("em"));
  assert.ok(out.querySelector("ul li"));
  assert.ok(out.querySelector("ol li"));
  assert.equal(out.querySelector("a").getAttribute("href"), "https://example.com/hotel");
  assert.ok(out.querySelector("table"));
  assert.match(out.querySelector("strong").textContent, /Exact property: Hotel Laxmi Niwas/);
});

test("malformed markdown does not inject HTML", () => {
  const dom = new JSDOM("<!doctype html><body><div id='out'></div></body>", { runScripts: "dangerously" });
  loadTripMarkdown(dom);
  const out = dom.window.document.getElementById("out");
  dom.window.TripMarkdown.renderMarkdown(out, "<img src=x onerror=alert(1)> **ok**");
  assert.equal(out.querySelectorAll("img").length, 0);
  assert.ok(out.textContent.includes("<img src=x onerror=alert(1)>"));
  assert.ok(out.querySelector("strong"));
});
