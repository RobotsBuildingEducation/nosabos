let resources;
const loadResources = () => resources ||= Promise.all([
  import("firebase/firestore"), import("../firebaseResources/firebaseResources"),
]).catch(error => { resources = null; throw error; });

export async function readPublicUserPreferences(npub) {
  const [{ doc, getDoc }, { database }] = await loadResources();
  return getDoc(doc(database, "users", npub));
}

export async function savePublicUserPreferences(npub, values) {
  const [{ doc, updateDoc }, { database }] = await loadResources();
  return updateDoc(doc(database, "users", npub), values);
}

export function trackPublicEvent(name, parameters) {
  void Promise.all([import("firebase/analytics"), loadResources()])
    .then(([{ logEvent }, [, { analytics }]]) => logEvent(analytics, name, parameters))
    .catch(() => {});
}
