// Onboarding only reads local drafts. Fail closed if a preview reaches persistence.
export const database = null;
export const simplemodel = null;
export const appCheckFetch = () => {
  throw new Error("Network calls are disabled in this preview");
};
