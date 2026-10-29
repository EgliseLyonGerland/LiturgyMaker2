import { createContext, useRouteLoaderData } from "react-router";

import type { clientLoader } from "@/layouts/main";

import type { CurrentUser } from "./current-user";

export const userContext = createContext<CurrentUser>();

export function useCurrentUser(): CurrentUser {
  const user = useRouteLoaderData<typeof clientLoader>("layouts/main");

  if (!user) {
    throw new Error("useCurrentUser() must be used within an authenticated route");
  }

  return user;
}
