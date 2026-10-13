async function loadFirestore() {
  const [firestore, { database }] = await Promise.all([
    import("firebase/firestore"),
    import("../firebaseResources/firebaseResources"),
  ]);
  return { ...firestore, database };
}

export async function readPublicUser(npub) {
  const { database, doc, getDoc } = await loadFirestore();
  return getDoc(doc(database, "users", npub));
}

export async function updatePublicUser(npub, patch) {
  const { database, doc, updateDoc } = await loadFirestore();
  return updateDoc(doc(database, "users", npub), patch);
}

export function logPublicEvent(name, params) {
  // Link navigation and opening a new tab remain synchronous in their click
  // handlers. Analytics loading must never hold up either action.
  void Promise.all([
    import("firebase/analytics"),
    import("../firebaseResources/firebaseResources"),
  ]).then(([{ logEvent }, { analytics }]) => logEvent(analytics, name, params)).catch(() => {});
}
