export const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);

export function renderSeoHead(metadata) {
  const { title, description, canonical, robots, alternates, schema } = metadata;
  return `<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
<meta name="robots" content="${robots}">
<link rel="canonical" href="${canonical}">
${alternates.map(item => `<link rel="alternate" hreflang="${item.language}" href="${item.url}">`).join("\n")}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Piyali">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="https://piyali.app/logo.png">
<meta property="og:image:alt" content="Piyali">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="https://piyali.app/logo.png">
${schema ? `<script type="application/ld+json" data-public-schema>${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>` : ""}`;
}

export function applyPublicMetadata(metadata) {
  document.head.querySelectorAll('title, meta[name="description"], meta[name="robots"], meta[property^="og:"], meta[name^="twitter:"], link[rel="canonical"], link[hreflang], script[data-public-schema]').forEach(node => node.remove());
  const template = document.createElement("template");
  template.innerHTML = renderSeoHead(metadata);
  document.head.append(template.content);
}
