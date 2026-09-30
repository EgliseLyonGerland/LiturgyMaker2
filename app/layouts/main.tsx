import { onAuthStateChanged } from "firebase/auth";
import { Outlet, redirect } from "react-router";

import { AppSidebar } from "@/components/app-sidebar";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { firebaseAuth } from "@/lib/firebase";

import type { Route } from "./+types/main";

const authMiddleware: Route.MiddlewareFunction = async ({ url }) => {
  const user = await new Promise((resolve) => {
    onAuthStateChanged(firebaseAuth, (user) => {
      resolve(user);
    });
  });

  if (!user) {
    throw redirect(`/auth?redirect=${encodeURI(url.pathname + url.searchParams)}`);
  }
};

export const clientMiddleware: Route.MiddlewareFunction[] = [authMiddleware];

export default function MainLayout() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b px-4 backdrop-blur-2xl">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="data-vertical:h-4 data-vertical:self-auto" />
          <div id="header" className="flex-1" />
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
