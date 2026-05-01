import { getFirestore } from "firebase/firestore";
import { app } from "./firebaseApp";

export const database = getFirestore(app);
