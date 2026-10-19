let pending;
export function loadFirebaseBackend() {
  return pending ||= import("./firebaseResources.js").catch((error) => {
    pending = null;
    throw error;
  });
}
