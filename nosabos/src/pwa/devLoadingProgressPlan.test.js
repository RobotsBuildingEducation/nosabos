import test from "node:test";
import assert from "node:assert/strict";
import { buildDevLoadingProgressPlan } from "./devLoadingProgressPlan.js";

test("development graph follows transformed static imports, preserves semantic queries, and excludes optional downloads", async () => {
  const modules = {
    "/src/main.jsx": 'import "/@vite/client"; import "./shared.js?v=abc"; import "./index.css"; import("./optional.js");',
    "/@vite/client": 'import "/src/shared.js?t=456";',
    "/src/shared.js?v=abc": 'export * from "./nested.js";',
    "/src/nested.js": 'export { value } from "./shared.js?t=789";',
    "/src/index.css": '',
    "/src/components/LinksPage.jsx": 'import "../shared.js?v=def"; import "/docs/policy.md?raw&import"; import "/docs/policy.md?import"; import "https://external.example/sdk.js"; import("./OptionalPage.jsx");',
    "/src/shared.js?v=def": 'export * from "./nested.js";',
    "/docs/policy.md?raw&import": 'export default "Policy";',
    "/docs/policy.md?import": 'export default "/policy.md";',
  };
  const requested = [];
  const server = { async transformRequest(url) {
    requested.push(url);
    assert.ok(Object.hasOwn(modules, url), `Unexpected module: ${url}`);
    return { code: modules[url] };
  } };
  const plan = await buildDevLoadingProgressPlan(server, "links");
  assert.deepEqual(new Set(plan.shell), new Set(["/src/main.jsx", "/@vite/client", "/src/shared.js", "/src/index.css", "/src/nested.js"]));
  assert.equal(plan.pages.links.resources.length, 8);
  assert.ok(plan.pages.links.resources.includes("/docs/policy.md?import=&raw="));
  assert.ok(plan.pages.links.resources.includes("/docs/policy.md?import="));
  assert.deepEqual(plan.pages.links.steps, ["shell", "code", "page"]);
  assert.ok(requested.every((url) => !/optional|external/i.test(url)));
});

test("development graph respects a configured base path and rejects unknown pages", async () => {
  const requested = [];
  const server = { async transformRequest(url) { requested.push(url); return { code: "" }; } };
  const plan = await buildDevLoadingProgressPlan(server, "landing", "/piyali/");
  assert.deepEqual(requested, ["/piyali/src/main.jsx", "/piyali/src/components/LandingPage.jsx"]);
  assert.deepEqual(plan.pages.landing.resources, ["/piyali/src/main.jsx", "/piyali/src/components/LandingPage.jsx"]);
  await assert.rejects(buildDevLoadingProgressPlan(server, "../../private"), /Unknown loading page/);
});
