const SECRET_KEY_SIGN_IN_NPUB_KEY = "auth:secretKeySignInNpub";

export const rememberSecretKeySignIn = (npub) => {
  if (typeof window === "undefined" || !npub) return;
  sessionStorage.setItem(SECRET_KEY_SIGN_IN_NPUB_KEY, String(npub).trim());
};

export const getSecretKeySignInNpub = () => {
  if (typeof window === "undefined") return "";
  return (sessionStorage.getItem(SECRET_KEY_SIGN_IN_NPUB_KEY) || "").trim();
};

export const clearSecretKeySignIn = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SECRET_KEY_SIGN_IN_NPUB_KEY);
};
