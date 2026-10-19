import { doc, updateDoc } from "firebase/firestore";
import { database } from "./firebaseResources.js";

export function updateUser(npub, fields) {
  return updateDoc(doc(database, "users", npub), fields);
}
