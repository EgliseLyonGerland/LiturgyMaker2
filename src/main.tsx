import { LucideProvider } from "lucide-react";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, redirect } from "react-router";
import { RouterProvider } from "react-router/dom";

import { MainLayout } from "./components/layouts/main-layout.tsx";
import { RootLayout } from "./components/layouts/root-layout.tsx";
import { AuthRoute } from "./components/routes/auth-route.tsx";
import { Toaster } from "./components/ui/toast.tsx";
import { TooltipProvider } from "./components/ui/tooltip.tsx";

const router = createBrowserRouter([
  {
    path: "/",
    Component: RootLayout,
    children: [
      {
        path: "/auth",
        Component: AuthRoute,
      },
      {
        path: "/",
        Component: MainLayout,
        children: [
          {
            index: true,
            loader: () => redirect("/liturgies"),
          },
          {
            path: "/liturgies",
            element: <div>Présidences</div>,
          },
          {
            path: "/songs",
            element: <div>Chants</div>,
          },
          {
            path: "/recitations",
            element: <div>Récitation</div>,
          },
        ],
      },
    ],
  },
]);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LucideProvider strokeWidth={1.5}>
      <TooltipProvider>
        <RouterProvider router={router} />
        <Toaster />
      </TooltipProvider>
    </LucideProvider>
  </StrictMode>,
);
