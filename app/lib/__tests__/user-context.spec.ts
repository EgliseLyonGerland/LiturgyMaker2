import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryRouter, RouterContextProvider, RouterProvider } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clientLoader, clientMiddleware, shouldRevalidate } from "@/layouts/main";

import { getCurrentUser, type CurrentUser } from "../current-user";
import { useCurrentUser, userContext } from "../user-context";

vi.mock("../current-user", () => ({ getCurrentUser: vi.fn() }));
vi.mock("@/components/app-sidebar", () => ({ AppSidebar: () => null }));

const user: CurrentUser = {
  auth: {
    uid: "user-1",
    email: "jean@example.com",
    displayName: null,
    photoURL: null,
    phoneNumber: null,
    emailVerified: true,
    isAnonymous: false,
    providerData: [],
    providerId: "password",
    refreshToken: "test",
    tenantId: null,
    metadata: {},
    delete: vi.fn(),
    getIdToken: vi.fn(),
    getIdTokenResult: vi.fn(),
    reload: vi.fn(),
    toJSON: vi.fn(),
  },
  profile: {
    firstName: "Jean",
    lastName: "Dupont",
    displayName: "Jean Dupont",
  },
};

function UserSummary() {
  const currentUser = useCurrentUser();
  return createElement("span", null, currentUser.profile?.displayName || currentUser.auth.email);
}

function createRouter(initialEntry = "/protected") {
  return createMemoryRouter(
    [
      {
        id: "layouts/main",
        path: "/protected",
        middleware: clientMiddleware,
        shouldRevalidate,
        loader: (args) =>
          clientLoader({
            ...args,
            serverLoader: async () => {
              throw new Error("No server loader");
            },
          }),
        Component: UserSummary,
        children: [
          {
            path: "child",
            loader: ({ context }) => context.get(userContext),
            action: ({ context }) => context.get(userContext).auth.uid,
          },
        ],
      },
      { path: "/auth", element: createElement("span", null, "Connexion") },
      { path: "/public", Component: UserSummary },
    ],
    { initialEntries: [initialEntry] },
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getCurrentUser).mockResolvedValue(user);
});

describe("authenticated user context", () => {
  it("exposes the authenticated user to nested loaders and components", async () => {
    const router = createRouter("/auth");

    try {
      await router.navigate("/protected/child");

      expect(router.state.loaderData["layouts/main"]).toBe(user);
      expect(Object.values(router.state.loaderData)).toEqual([user, user]);
      expect(renderToStaticMarkup(createElement(RouterProvider, { router }))).toContain(
        "Jean Dupont",
      );
    } finally {
      router.dispose();
    }
  });

  it("exposes the authenticated user to nested actions", async () => {
    const router = createRouter("/auth");

    try {
      await router.navigate("/protected/child", {
        formMethod: "post",
        formData: new FormData(),
      });

      expect(Object.values(router.state.actionData ?? {})).toEqual(["user-1"]);
    } finally {
      router.dispose();
    }
  });

  it("renders only the email when there is no profile", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ ...user, profile: null });
    const router = createRouter("/auth");

    try {
      await router.navigate("/protected");

      expect(renderToStaticMarkup(createElement(RouterProvider, { router }))).toContain(
        "jean@example.com",
      );
    } finally {
      router.dispose();
    }
  });

  it("refreshes the component user when navigating within the protected layout", async () => {
    const router = createRouter("/auth");

    try {
      await router.navigate("/protected");
      vi.mocked(getCurrentUser).mockResolvedValue({
        ...user,
        auth: { ...user.auth, uid: "user-2", email: "other@example.com" },
        profile: null,
      });

      await router.navigate("/protected/child");

      expect(renderToStaticMarkup(createElement(RouterProvider, { router }))).toContain(
        "other@example.com",
      );
    } finally {
      router.dispose();
    }
  });

  it("redirects signed-out users and preserves the full path and query", async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);
    const router = createRouter("/auth");

    try {
      await router.navigate("/protected/child?search=a%26b&next=1");

      expect(router.state.location.pathname).toBe("/auth");
      expect(new URLSearchParams(router.state.location.search).get("redirect")).toBe(
        "/protected/child?search=a%26b&next=1",
      );
      expect(router.state.loaderData).toEqual({});
    } finally {
      router.dispose();
    }
  });

  it("rejects router context access outside authenticated middleware", () => {
    expect(() => new RouterContextProvider().get(userContext)).toThrow();
  });

  it("rejects hook access outside the authenticated layout", () => {
    const router = createRouter("/public");

    try {
      expect(() => renderToStaticMarkup(createElement(RouterProvider, { router }))).toThrow(
        "useCurrentUser() must be used within an authenticated route",
      );
    } finally {
      router.dispose();
    }
  });
});
