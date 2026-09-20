import { createRemoteJWKSet, jwtVerify } from "jose";

// Firebase rotates these public signing keys; jose caches and refreshes them.
const firebaseKeys = createRemoteJWKSet(
  new URL("https://firebaseappcheck.googleapis.com/v1/jwks"),
  { cacheMaxAge: 6 * 60 * 60 * 1000, timeoutDuration: 5000 },
);

export async function verifyAppCheck(token, env, keys = firebaseKeys) {
  const { payload, protectedHeader } = await jwtVerify(token, keys, {
    algorithms: ["RS256"],
    issuer: `https://firebaseappcheck.googleapis.com/${env.FIREBASE_PROJECT_NUMBER}`,
    audience: `projects/${env.FIREBASE_PROJECT_NUMBER}`,
    requiredClaims: ["exp", "iat", "sub"],
  });
  if (protectedHeader.typ !== "JWT" || payload.sub !== env.FIREBASE_APP_ID) {
    throw new Error("Invalid App Check token.");
  }
  return payload;
}
