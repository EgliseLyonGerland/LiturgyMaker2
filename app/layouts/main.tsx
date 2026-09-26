import { onAuthStateChanged } from "firebase/auth";
import { Outlet, redirect } from "react-router";

import { AppSidebar } from "@/components/app-sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
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
          <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
          <div id="header" />
          {/* <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Nav</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Nav</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb> */}
        </header>
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
