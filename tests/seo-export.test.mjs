import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = path => readFile(new URL(`../out/${path}`, import.meta.url), "utf8");
const expected = {
  fr: "Dirigez avec assurance.",
  en: "Lead with confidence.",
  ar: "بثقة",
};

for (const lang of ["fr", "en", "ar"]) {
  test(`${lang} has independently rendered content, canonical URL and language alternatives`, async () => {
    const html = await read(`${lang}/index.html`);
    const body = html.split("<body")[1].split("<script")[0];
    assert.ok(body.includes(expected[lang]), `Missing ${lang} content`);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://nexusacademy\\.ma/${lang}/"`));
    for (const code of ["fr", "en", "ar", "x-default"]) {
      assert.match(html, new RegExp(`hrefLang="${code}"`));
    }
    for (const code of ["fr", "en", "ar"]) assert.ok(body.includes(`href="/${code}/"`));
    assert.ok(!html.includes('name="robots" content="noindex'));
    assert.ok(body.includes('class="calc-total"'), "Pricing calculator must remain rendered");
  });
}

test("sitemap lists public language pages only and dashboard remains noindex", async () => {
  const sitemap = await read("sitemap.xml");
  for (const lang of ["fr", "en", "ar"]) assert.ok(sitemap.includes(`https://nexusacademy.ma/${lang}/`));
  assert.ok(!sitemap.includes("/admin"));
  const robots = await read("robots.txt");
  assert.ok(robots.includes("Sitemap: https://nexusacademy.ma/sitemap.xml"));
  assert.ok(robots.includes("Disallow: /admin/"));
  assert.match(await read("admin/index.html"), /name="robots" content="noindex, nofollow"/);
});
