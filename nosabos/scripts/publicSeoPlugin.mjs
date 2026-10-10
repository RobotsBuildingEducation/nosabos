import { renderSeoHead, escapeHtml } from "../src/seo/head.js";
import { INDEXABLE_PUBLIC_PATHS, LOCALIZED_PUBLIC_PATHS, SITE_ORIGIN, getPublicMetadata } from "../src/seo/publicRoutes.js";
import { renderLearningDocument } from "../src/seo/learningPage.js";

export function publicSeoPlugin() {
  return {
    name: "public-seo",
    transformIndexHtml: { order: "pre", handler(html, context) {
      const path = context.path === "/index.html" ? "/" : context.path;
      return html.replace("<!-- public-seo -->", renderSeoHead(getPublicMetadata(path)));
    } },
    generateBundle(_options, bundle) {
      const paths = [...INDEXABLE_PUBLIC_PATHS, ...LOCALIZED_PUBLIC_PATHS];
      const fonts = [400, 700].map(weight => {
        const font = Object.keys(bundle).find(name => name.includes(`dm-sans-latin-${weight}-normal`) && name.endsWith(".woff2"));
        return font ? `@font-face{font-family:'DM Sans';font-style:normal;font-weight:${weight};font-display:swap;src:url('/${font}') format('woff2')}` : "";
      }).join("");
      for (const path of paths.filter(path => getPublicMetadata(path).target)) {
        this.emitFile({ type: "asset", fileName: `${path.slice(1)}.html`, source: renderLearningDocument(path, fonts) });
      }
      const urls = [...new Set(paths.map(path => getPublicMetadata(path).canonical))];
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url => `<url><loc>${escapeHtml(url)}</loc></url>`).join("")}</urlset>` });
      this.emitFile({ type: "asset", fileName: "robots.txt", source: `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n` });
    },
  };
}
