import { initializeApp } from "firebase/app";
import {
  browserLocalPersistence,
  connectAuthEmulator,
  debugErrorMap,
  initializeAuth,
} from "firebase/auth";
import { connectFirestoreEmulator, initializeFirestore } from "firebase/firestore";

import { firebaseConfig } from "@/config/firebase";

const firebaseApp = initializeApp(firebaseConfig);

const firebaseAuth = initializeAuth(firebaseApp, {
  errorMap: debugErrorMap,
  persistence: browserLocalPersistence,
});
const firebaseDb = initializeFirestore(firebaseApp, {});

if (import.meta.env.DEV) {
  connectAuthEmulator(firebaseAuth, "http://localhost:9099");
  connectFirestoreEmulator(firebaseDb, "localhost", 8080);
}

export { firebaseAuth, firebaseDb };
