import { getMessaging, isSupported } from "firebase/messaging";
import { app } from "./firebaseApp";

let messagingPromise;

export function getMessagingInstance() {
  if (!messagingPromise) {
    messagingPromise = isSupported().then((supported) =>
      supported ? getMessaging(app) : null,
    );
  }

  return messagingPromise;
}
