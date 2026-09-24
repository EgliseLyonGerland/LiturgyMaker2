import { redirect } from "react-router";

import { getNextLiturgyId } from "@/lib/liturgy-utils";

import type { Route } from "./+types/liturgies";

const redirectMiddleware: Route.MiddlewareFunction = () => {
  const nextLiturgyId = getNextLiturgyId();

  return redirect(`/liturgies/${nextLiturgyId}`);
};

export const clientMiddleware: Route.MiddlewareFunction[] = [redirectMiddleware];
