import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import * as v from "valibot";

import { toast } from "@/components/ui/toast";

import { firebaseAuth, firebaseDb } from "./firebase";
import { queryClient } from "./query-client";

const userProfileQueryKey = ["user-profile"];

onAuthStateChanged(firebaseAuth, (user) => {
  queryClient.removeQueries({
    queryKey: userProfileQueryKey,
    predicate: (query) => query.queryKey[1] !== user?.uid,
  });
});

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

  const profile = await queryClient.query({
    queryKey: [...userProfileQueryKey, auth.uid],
    queryFn: async (): Promise<UserProfile | null> => {
      const snapshot = await getDoc(doc(firebaseDb, "users", auth.uid));

      if (!snapshot.exists()) {
        return null;
      }

      const result = v.safeParse(userProfileSchema, snapshot.data());

      if (!result.success) {
        toast.add({
          title: "Profil utilisateur invalide",
          description: "Le nom ne peut pas être affiché. Seule l'adresse email sera utilisée.",
          type: "warning",
        });

        return null;
      }

      return result.output;
    },
    staleTime: Infinity,
    gcTime: Infinity,
  });

  return { auth, profile };
}
