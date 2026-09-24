import { onAuthStateChanged } from "firebase/auth";
import { redirect } from "react-router";

import { firebaseAuth } from "@/lib/firebase";
import { getNextLiturgyId } from "@/lib/liturgy-utils";

import type { Route } from "./+types/auth";

const authMiddleware: Route.MiddlewareFunction = async () => {
  throw redirect(`/liturgies/${getNextLiturgyId()}`);
};

export const clientMiddleware: Route.MiddlewareFunction[] = [authMiddleware];
