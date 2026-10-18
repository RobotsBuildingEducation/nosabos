let actions;
export function loadPublicFirebaseActions() {
  return actions ||= import("./firebaseActions.js").catch((error) => {
    actions = null;
    throw error;
  });
}
export function recordPublicEvent(name, parameters) {
  void loadPublicFirebaseActions().then((module) => module.recordEvent(name, parameters))
    .catch((error) => console.warn("Could not record public-page event", error));
}
export async function updatePublicUser(npub, fields) {
  return (await loadPublicFirebaseActions()).updateUser(npub, fields);
}
