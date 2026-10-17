import { parse } from "@babel/parser";
import { LOADING_PAGE_COMPONENTS, loadingStepsFor } from "./loadingProgressPlan.js";

// Vite serves individual transformed modules in development, rather than the
// production chunks. Read their actual static imports without executing them.
export async function buildDevLoadingProgressPlan(server, pageKey, base = "/") {
  if (!Object.hasOwn(LOADING_PAGE_COMPONENTS, pageKey)) throw new Error("Unknown loading page");
  const moduleCache = new Map();
  const origin = "http://vite.local";
  const dependencies = (url) => {
    if (!moduleCache.has(url)) moduleCache.set(url, (async () => {
      const result = await server.transformRequest(url);
      if (!result) return [];
      const ast = parse(result.code, { sourceType: "module" });
      return ast.program.body.flatMap((node) => {
        if (!["ImportDeclaration", "ExportNamedDeclaration", "ExportAllDeclaration"].includes(node.type) || !node.source) return [];
        const name = node.source.value;
        if (!name.startsWith(".") && !name.startsWith("/")) return [];
        const resolved = new URL(name, `${origin}${url}`);
        return resolved.origin === origin ? [`${resolved.pathname}${resolved.search}`] : [];
      });
    })());
    return moduleCache.get(url);
  };
  const collect = async (entry) => {
    const urls = new Set();
    const visit = async (url) => {
      // Cache-busting versions identify the same required module. Keep semantic
      // import queries, such as ?raw and ?import, as separate dependencies.
      const normalized = new URL(url, origin);
      normalized.searchParams.delete("v");
      normalized.searchParams.delete("t");
      normalized.searchParams.sort();
      const key = `${normalized.pathname}${normalized.search}`;
      if (urls.has(key)) return;
      urls.add(key);
      await Promise.all((await dependencies(url)).map(visit));
    };
    await visit(entry);
    return urls;
  };
  const shell = [...await collect(`${base}src/main.jsx`)];
  const component = LOADING_PAGE_COMPONENTS[pageKey];
  const route = component ? [...await collect(`${base}${component.slice(1)}`)] : [];
  return { shell, pages: { [pageKey]: { resources: [...new Set([...shell, ...route])], steps: loadingStepsFor(pageKey) } } };
}
