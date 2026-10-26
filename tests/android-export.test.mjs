import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

for (const route of ["index.html", "admin/index.html"]) {
  test(`Android ${route} contains only the dashboard sign-in`, async () => {
    const html = await readFile(new URL(`../out/${route}`, import.meta.url), "utf8");
    assert.match(html, /<title>NEXUS[^<]*Admin<\/title>/);
    assert.match(html, /class="nexus-page admin-page"/);
    assert.match(html, /NEXUS \/ PRIVATE/);
    assert.doesNotMatch(html, /<a\b[^>]*href="\/"/);
    assert.doesNotMatch(html, /id="analytics-consent-panel"/);
    assert.doesNotMatch(html, /class="[^"]*cinema-hero/);
  });
}
