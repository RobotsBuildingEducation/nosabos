export const PUBLIC_WORKBOX_OPTIONS = {
  maximumFileSizeToCacheInBytes: 10000000,
  navigateFallbackDenylist: [/^\/api(?:\/|$)/, /^\/version\.json$/, /^\/(?:[a-z]{2}\/)?learn(?:\/|$)/],
  // Localized public HTML is served on demand; the cached app shell already
  // contains every UI language. Don't install all translations up front.
  globIgnores: ["**/version.json", "??.html", "??/**/*.html"],
};
