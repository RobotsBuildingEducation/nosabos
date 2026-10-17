// The inline loading screen must be able to paint while Vite's application CSS
// downloads. Print media avoids blocking screen rendering; onload applies the
// already-parsed sheet. main.jsx waits for these sheets before mounting React.
export function deferStartupStyles(html) {
  return html.replace(/<link\b[^>]*>/gi, (tag) => {
    if (!/\brel\s*=\s*(["'])stylesheet\1/i.test(tag) || /\bmedia\s*=/i.test(tag)) return tag;
    return tag.replace(/\s*\/?>(\s*)$/, ' media="print" data-startup-stylesheet fetchpriority="high" onload="this.media=\'all\';this.dataset.startupLoaded=\'true\'">$1');
  });
}
