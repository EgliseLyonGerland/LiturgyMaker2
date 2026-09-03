import { onAuthStateChanged } from "firebase/auth";
import { redirect } from "react-router";

import { firebaseAuth } from "@/lib/firebase";

import type { Route } from "./+types/auth";

const authMiddleware: Route.MiddlewareFunction = async () => {
  const user = await new Promise((resolve) => {
    onAuthStateChanged(firebaseAuth, (user) => {
      resolve(user);
    });
  });

  if (!user) {
    throw redirect("/auth");
  }
};

export const clientMiddleware: Route.MiddlewareFunction[] = [authMiddleware];
