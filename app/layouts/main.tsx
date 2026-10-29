import { Outlet, redirect } from "react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { getCurrentUser, type CurrentUser } from "@/lib/current-user";
import { userContext } from "@/lib/user-context";

import type { Route } from "./+types/main";

const authMiddleware = (async ({ url, context }) => {
  const user = await getCurrentUser();

  if (!user) {
    throw redirect(`/auth?redirect=${encodeURIComponent(url.pathname + url.search)}`);
  }

  context.set(userContext, user);
}) satisfies Route.ClientMiddlewareFunction;

export const clientMiddleware = [authMiddleware];

export function clientLoader({ context }: Route.ClientLoaderArgs): CurrentUser {
  return context.get(userContext);
}

export function shouldRevalidate() {
  return true;
}

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center gap-2 border-b px-4 backdrop-blur-2xl">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto" />
          <div id="header" className="flex-1" />
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
