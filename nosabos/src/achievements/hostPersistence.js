import { collection, doc, getDocsFromServer as getDocs, runTransaction, onSnapshot } from "firebase/firestore";
import { database } from "../firebaseResources/firestore.js";
import { createAchievementPersistence } from "./firestoreRecords.js";
export const achievementPersistence = createAchievementPersistence({ database, collection, doc, getDocs, runTransaction, onSnapshot });
