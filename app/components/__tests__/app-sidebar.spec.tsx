import { type ComponentProps, type ReactNode, useEffect } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NavLink, type Navigation } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppSidebar } from "../app-sidebar";
import { DropdownMenuItem } from "../ui/dropdown-menu";

const sidebar = vi.hoisted(() => ({
  isMobile: true,
  setOpenMobile: vi.fn(),
  navigate: vi.fn(),
  navigationLocation: undefined as Navigation["location"],
}));

vi.mock("react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react")>()),
  useEffect: vi.fn(),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => sidebar.isMobile,
}));

vi.mock("@/lib/user-context", () => ({
  useCurrentUser: () => ({
    auth: { email: "jean@example.com" },
    profile: null,
  }),
}));

vi.mock("react-router", () => ({
  NavLink: vi.fn((_props: ComponentProps<typeof NavLink>) => null),
  useLocation: () => ({ pathname: "/songs" }),
  useNavigate: () => sidebar.navigate,
  useNavigation: () => ({ location: sidebar.navigationLocation }),
}));

vi.mock("../ui/sidebar", () => ({
  Sidebar: "div",
  SidebarContent: "div",
  SidebarFooter: "div",
  SidebarGroup: "div",
  SidebarGroupContent: "div",
  SidebarHeader: "div",
  SidebarMenu: "ul",
  SidebarMenuButton: ({ render }: { render?: ReactNode }) => render ?? null,
  SidebarMenuItem: "li",
  SidebarRail: () => null,
  useSidebar: () => sidebar,
}));

vi.mock("../ui/dropdown-menu", () => ({
  DropdownMenu: "div",
  DropdownMenuContent: ({ children }: { children: ReactNode }) => children,
  DropdownMenuGroup: "div",
  DropdownMenuItem: vi.fn((_props: { onClick?: () => void }) => null),
  DropdownMenuLabel: "div",
  DropdownMenuSeparator: () => null,
  DropdownMenuTrigger: () => null,
}));

vi.mock("../theme", () => ({
  ThemeSwitcherDropdownMenuGroup: () => null,
}));

beforeEach(() => {
  vi.clearAllMocks();
  sidebar.isMobile = true;
  sidebar.navigationLocation = undefined;
});

function runNavigationEffect() {
  vi.mocked(useEffect).mockClear();
  renderToStaticMarkup(<AppSidebar />);

  const [effect, dependencies] = vi.mocked(useEffect).mock.calls[0];
  expect(dependencies).toEqual([
    sidebar.navigationLocation,
    sidebar.isMobile,
    sidebar.setOpenMobile,
  ]);
  effect();
}

describe("AppSidebar navigation", () => {
  it("renders navigation links without closing the sidebar directly on click", () => {
    renderToStaticMarkup(<AppSidebar />);

    expect(vi.mocked(NavLink).mock.calls.map(([props]) => props.to)).toEqual([
      "/liturgies",
      "/songs",
      "/recitations",
    ]);
    for (const [props] of vi.mocked(NavLink).mock.calls) {
      expect(props.onClick).toBeUndefined();
    }
    expect(sidebar.setOpenMobile).not.toHaveBeenCalled();
  });

  it("closes the mobile sidebar when the effect runs initially, even without navigation", () => {
    runNavigationEffect();

    expect(sidebar.setOpenMobile.mock.calls).toEqual([[false]]);
  });

  it.each(["/liturgies", "/songs", "/recitations", "/logout"])(
    "closes the mobile sidebar when navigation starts and finishes (%s)",
    (pathname) => {
      sidebar.navigationLocation = {
        pathname,
        search: "",
        hash: "",
        state: null,
        key: "next-page",
      };
      runNavigationEffect();

      expect(sidebar.setOpenMobile.mock.calls).toEqual([[false]]);

      sidebar.setOpenMobile.mockClear();
      sidebar.navigationLocation = undefined;
      runNavigationEffect();

      expect(sidebar.setOpenMobile.mock.calls).toEqual([[false]]);
    },
  );

  it("leaves the desktop sidebar unchanged before, during and after navigation", () => {
    sidebar.isMobile = false;
    runNavigationEffect();

    sidebar.navigationLocation = {
      pathname: "/songs",
      search: "",
      hash: "",
      state: null,
      key: "next-page",
    };
    runNavigationEffect();

    sidebar.navigationLocation = undefined;
    runNavigationEffect();

    expect(sidebar.setOpenMobile).not.toHaveBeenCalled();
  });

  it("closes the sidebar when the effect runs after switching to mobile", () => {
    sidebar.isMobile = false;
    runNavigationEffect();
    expect(sidebar.setOpenMobile).not.toHaveBeenCalled();

    sidebar.isMobile = true;
    runNavigationEffect();

    expect(sidebar.setOpenMobile.mock.calls).toEqual([[false]]);
  });

  it.each([true, false])("starts logout without closing directly (mobile: %s)", (isMobile) => {
    sidebar.isMobile = isMobile;
    renderToStaticMarkup(<AppSidebar />);

    const onClick = vi.mocked(DropdownMenuItem).mock.calls[0][0].onClick;
    expect(onClick).toBeDefined();
    onClick?.({} as Parameters<NonNullable<typeof onClick>>[0]);

    expect(sidebar.navigate).toHaveBeenCalledWith("/logout");
    expect(sidebar.setOpenMobile).not.toHaveBeenCalled();
  });
});
