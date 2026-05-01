import { getAnalytics } from "firebase/analytics";
import { app } from "./firebaseApp";

export const analytics = getAnalytics(app);
