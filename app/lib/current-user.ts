import type { User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import * as v from "valibot";

import { toast } from "@/components/ui/toast";

import { firebaseAuth, firebaseDb } from "./firebase";

const userProfileSchema = v.object({
  firstName: v.string(),
  lastName: v.string(),
  displayName: v.string(),
});

export type UserProfile = v.InferOutput<typeof userProfileSchema>;

export interface CurrentUser {
  auth: User;
  profile: UserProfile | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  await firebaseAuth.authStateReady();

  const auth = firebaseAuth.currentUser;

  if (!auth) {
    return null;
  }

  const snapshot = await getDoc(doc(firebaseDb, "users", auth.uid));

  if (!snapshot.exists()) {
    return { auth, profile: null };
  }

  const result = v.safeParse(userProfileSchema, snapshot.data());

  if (!result.success) {
    toast.add({
      title: "Profil utilisateur invalide",
      description: "Le nom ne peut pas être affiché. Seule l'adresse email sera utilisée.",
      type: "warning",
    });

    return { auth, profile: null };
  }

  return { auth, profile: result.output };
}
