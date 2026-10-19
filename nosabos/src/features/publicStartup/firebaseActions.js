import { logEvent } from "firebase/analytics";
import { analytics } from "../../firebaseResources/firebaseResources.js";
export { updateUser } from "../../firebaseResources/userPersistence.js";

export function recordEvent(name, parameters) { logEvent(analytics, name, parameters); }
