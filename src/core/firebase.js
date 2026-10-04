import { initializeApp, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "../../vendor/firebase.js";
import { firebaseConfig } from "../config/firebase-config.js";

export const isConfigured = () => !Object.values(firebaseConfig).some((value) => String(value).includes("PASTE_"));

const app = initializeApp(firebaseConfig);

export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
