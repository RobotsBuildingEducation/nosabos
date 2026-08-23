const BUILT_IN_MASTER_NPUBS = [
  "npub1anf7634v6rmwjzjnraf09kudr4nsmwy4ggre74sqgqaljd7c5susc8xpev",
];

const configuredMasterNpubs = String(
  import.meta.env?.VITE_MASTER_UNLOCK_NPUBS || "",
)
  .split(/[\s,]+/)
  .map((npub) => npub.trim())
  .filter(Boolean);

const masterNpubs = new Set([
  ...BUILT_IN_MASTER_NPUBS,
  ...configuredMasterNpubs,
]);

export function isMasterUnlockNpub(npub) {
  return masterNpubs.has(typeof npub === "string" ? npub.trim() : "");
}

export function isMasterUnlockActive(activeNpub = "") {
  if (isMasterUnlockNpub(activeNpub)) return true;

  if (typeof window === "undefined") return false;

  return isMasterUnlockNpub(localStorage.getItem("local_npub"));
}
