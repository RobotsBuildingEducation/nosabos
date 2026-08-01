export function resolveSubscriptionAccess({
  patreonVerified = false,
  passcodeVerified = false,
} = {}) {
  const authorized = Boolean(patreonVerified);

  return {
    authorized,
    requiresPatreonMigration: Boolean(passcodeVerified) && !authorized,
  };
}
