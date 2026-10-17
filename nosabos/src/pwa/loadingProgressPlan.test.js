import test from "node:test";
import assert from "node:assert/strict";
import { buildLoadingProgressPlans } from "./loadingProgressPlan.js";

function chunk(fileName, facadeModuleId, imports = [], css = [], dynamicImports = []) {
  return { type: "chunk", fileName, facadeModuleId, imports, dynamicImports, viteMetadata: { importedCss: new Set(css) } };
}

test("page plans include static JS and CSS once, and exclude other pages and optional dynamic imports", () => {
  const bundle = {
    "assets/main.js": chunk("assets/main.js", "/project/src/main.jsx", ["assets/shared.js"], ["assets/main.css"], ["assets/links.js", "assets/app.js"]),
    "assets/shared.js": chunk("assets/shared.js", null, [], ["assets/shared.css"]),
    "assets/links.js": chunk("assets/links.js", "/project/src/components/LinksPage.jsx", ["assets/shared.js"], ["assets/links.css"]),
    "assets/app.js": chunk("assets/app.js", "/project/src/App.jsx", ["assets/shared.js"], [], ["assets/game.js"]),
    "assets/game.js": chunk("assets/game.js", "/project/src/components/RPGGame/GameRouter.jsx"),
  };
  const plans = buildLoadingProgressPlans(bundle);
  assert.deepEqual(plans.pages.links.resources, ["/assets/main.js", "/assets/main.css", "/assets/shared.js", "/assets/shared.css", "/assets/links.js", "/assets/links.css"]);
  assert.ok(!plans.pages.landing.resources.includes("/assets/links.js"));
  assert.ok(!plans.pages.app.resources.includes("/assets/game.js"));
  assert.deepEqual(plans.pages.app.steps, ["shell", "code", "profile", "access", "lessons", "page"]);
});

test("shared cycles terminate and plans respect the hosting base path", () => {
  const bundle = {
    "assets/main.js": chunk("assets/main.js", "/project/src/main.jsx", ["assets/shared.js"]),
    "assets/shared.js": chunk("assets/shared.js", null, ["assets/main.js"]),
  };
  assert.deepEqual(buildLoadingProgressPlans(bundle, "/learn/").shell, ["/learn/assets/main.js", "/learn/assets/shared.js"]);
});

test("HTML entry facades still resolve the application shell through their module IDs", () => {
  const main = chunk("assets/index.js", "/project/index.html", [], ["assets/index.css"]);
  main.moduleIds = ["/project/src/main.jsx"];
  assert.deepEqual(buildLoadingProgressPlans({ "assets/index.js": main }).shell, ["/assets/index.js", "/assets/index.css"]);
});
