import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { setDefaultOptions } from "date-fns";

import "./style.css";
import { fr } from "date-fns/locale";
import { LucideProvider } from "lucide-react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import { ThemeProvider } from "@/components/theme";
import { Title } from "@/components/title";
import { Spinner } from "@/components/ui/spinner";
import { Toaster } from "@/components/ui/toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/query-client";

import type { Route } from "./+types/root";

setDefaultOptions({ locale: fr });

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem('theme') || 'system';
                  var media = window.matchMedia('(prefers-color-scheme: dark)');
                  var isDark = stored === 'dark' || (stored === 'system' && media.matches);

                  document.documentElement.dataset.theme = stored;
                  if (isDark) document.documentElement.classList.add('dark');
                } catch (_) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        {children}
        <Title />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LucideProvider strokeWidth={2}>
          <TooltipProvider>
            <Outlet />
            <Toaster />
            <ReactQueryDevtools initialIsOpen={false} />
          </TooltipProvider>
        </LucideProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404 ? "The requested page could not be found." : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container mx-auto p-4 pt-16">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full overflow-x-auto p-4">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}

export function HydrateFallback() {
  return (
    <div className="flex h-svh w-full items-center justify-center">
      <Spinner className="size-8" />
    </div>
  );
}
