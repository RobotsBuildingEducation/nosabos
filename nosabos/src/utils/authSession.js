const SECRET_KEY_SIGN_IN_NPUB_KEY = "auth:secretKeySignInNpub";
const ACCOUNT_SWITCH_NPUB_KEY = "auth:accountSwitchNpub";

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

export const rememberAccountSwitch = (npub) => {
  if (typeof window === "undefined" || !npub) return;
  sessionStorage.setItem(ACCOUNT_SWITCH_NPUB_KEY, String(npub).trim());
};

export const getAccountSwitchNpub = () => {
  if (typeof window === "undefined") return "";
  return (sessionStorage.getItem(ACCOUNT_SWITCH_NPUB_KEY) || "").trim();
};

export const clearAccountSwitch = () => {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(ACCOUNT_SWITCH_NPUB_KEY);
};
