import { collection, doc, getDocFromServer as getDoc, getDocsFromServer as getDocs, runTransaction, onSnapshot } from "firebase/firestore";
import { database } from "../firebaseResources/firestore.js";
import { createAchievementPersistence } from "./firestoreRecords.js";
import { createFirestoreAchievementBackfill } from "./backfill.js";
const dependencies = { database, collection, doc, getDoc, getDocs, runTransaction, onSnapshot };
export const achievementPersistence = {
  ...createAchievementPersistence(dependencies),
  ...createFirestoreAchievementBackfill({ ...dependencies, source: "nosabos",
    scan: async npub => {
      const { scanPiyaliAchievementHistory } = await import("../utils/piyaliAchievementBackfill.js");
      return scanPiyaliAchievementHistory(npub, dependencies);
    },
  }),
};
