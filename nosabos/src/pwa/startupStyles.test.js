import test from "node:test";
import assert from "node:assert/strict";
import { deferStartupStyles } from "./startupStyles.js";

test("production application CSS downloads without blocking the inline loading screen", () => {
  const html = '<link rel="stylesheet" crossorigin href="/assets/index-abc.css">';
  const result = deferStartupStyles(html);
  assert.match(result, /href="\/assets\/index-abc.css"/);
  assert.match(result, /media="print"/);
  assert.match(result, /data-startup-stylesheet/);
  assert.match(result, /onload="this.media='all';this.dataset.startupLoaded='true'"/);
  assert.equal(deferStartupStyles(result), result);
});

test("optional fonts, media-specific styles, and other resources retain their loading behavior", () => {
  const html = `<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gaegu" media="print" onload="this.media='all'">
<link rel="stylesheet" href="/print.css" media="print">
<link rel="icon" href="/logo.png">
<link rel="modulepreload" href="/assets/main.js">`;
  assert.equal(deferStartupStyles(html), html);
});
