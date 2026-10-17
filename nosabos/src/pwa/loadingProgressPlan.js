// A fixed dependency list for each route, taken from Vite's actual output graph.
// Optional media and background PWA caching don't gate opening the page.
export const LOADING_PAGE_COMPONENTS = {
  landing: "/src/components/LandingPage.jsx",
  app: "/src/App.jsx",
  links: "/src/components/LinksPage.jsx",
  "legacy-links": "/src/components/LegacyLinksPage.jsx",
  proficiency: "/src/components/ProficiencyTest.jsx",
  orbing: "/src/components/orbing/OrbingPlayground.jsx",
  squircle: "/src/components/SquirclePlayground.jsx",
  citizenship: "/src/components/CitizenshipGuide.jsx",
  "patreon-return": "/src/components/PatreonOAuthDrawerReturn.jsx",
};

export function loadingStepsFor(key) {
  return key === "app" ? ["shell", "code", "profile", "access", "lessons", "page"]
    : ["shell", "code", "page"];
}

export function buildLoadingProgressPlans(bundle, base = "/") {
  const chunks = Object.values(bundle).filter((item) => item.type === "chunk");
  const matches = (id, suffix) => id?.replaceAll("\\", "/").endsWith(suffix);
  const find = (suffix) => chunks.find((chunk) => matches(chunk.facadeModuleId, suffix))
    || chunks.find((chunk) => chunk.moduleIds?.some((id) => matches(id, suffix)));
  const resourcesFor = (chunk, seen = new Set()) => {
    if (!chunk || seen.has(chunk.fileName)) return seen;
    seen.add(chunk.fileName);
    for (const css of chunk.viteMetadata?.importedCss || []) seen.add(css);
    for (const dependency of chunk.imports) resourcesFor(bundle[dependency], seen);
    return seen;
  };
  const shell = [...resourcesFor(find("/src/main.jsx"))].map((file) => `${base}${file}`);
  const pages = Object.fromEntries(Object.entries(LOADING_PAGE_COMPONENTS).map(([key, component]) => [key, {
    resources: [...new Set([...shell, ...[...resourcesFor(component ? find(component) : null)].map((file) => `${base}${file}`)])],
    steps: loadingStepsFor(key),
  }]));
  return { shell, pages };
}
