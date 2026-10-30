import { renderToStaticMarkup } from "react-dom/server";
import { Navigate, type NavigateProps } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Auth from "../auth";

const authState = vi.hoisted(() => ({
  loading: false,
  authenticated: false,
  search: "",
}));

vi.mock("@/lib/firebase", () => ({
  firebaseAuth: {},
}));

vi.mock("react-firebase-hooks/auth", () => ({
  useAuthState: () => [
    authState.authenticated ? { uid: "user-1" } : null,
    authState.loading,
    undefined,
  ],
}));

vi.mock("react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-router")>()),
  UNSAFE_withComponentProps: (Component: React.ComponentType) => Component,
  Navigate: vi.fn((_props: NavigateProps) => null),
  useSearchParams: () => [new URLSearchParams(authState.search)],
  useFetcher: () => ({ submit: vi.fn(), state: "idle" }),
}));

vi.mock("nuqs", async (importOriginal) => ({
  ...(await importOriginal<typeof import("nuqs")>()),
  useQueryState: () => [null, vi.fn()],
}));

beforeEach(() => {
  vi.clearAllMocks();
  authState.loading = false;
  authState.authenticated = false;
  authState.search = "";
});

describe("Auth loading screen", () => {
  it("shows an accessible loader while Firebase restores the session", () => {
    authState.loading = true;

    const html = renderToStaticMarkup(<Auth />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Chargement en cours"');
    expect(html).not.toContain("<form");
    expect(Navigate).not.toHaveBeenCalled();
  });

  it.each([
    ["", "/"],
    ["redirect=%2Fsongs%3Fsearch%3Dtest", "/songs?search=test"],
  ])("keeps the loader visible during redirection (%s)", (search, destination) => {
    authState.authenticated = true;
    authState.search = search;

    const html = renderToStaticMarkup(<Auth />);

    expect(html).toContain('role="status"');
    expect(html).not.toContain("<form");
    expect(vi.mocked(Navigate).mock.calls[0]?.[0]).toEqual({
      to: destination,
      replace: true,
    });
  });

  it("shows the login form once the signed-out state is known", () => {
    const html = renderToStaticMarkup(<Auth />);

    expect(html).toContain("<form");
    expect(html).toContain("Connexion");
    expect(html).not.toContain('role="status"');
    expect(Navigate).not.toHaveBeenCalled();
  });
});
