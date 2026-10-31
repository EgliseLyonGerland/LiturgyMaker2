import { MonitorIcon, MoonIcon, SunIcon } from "lucide-react";
import { createContext, useContext, useSyncExternalStore } from "react";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Button } from "./ui/button";

export type Theme = "light" | "dark" | "system";

const themes: { key: Theme; name: string; icon: typeof SunIcon }[] = [
  {
    key: "light",
    name: "Clair",
    icon: SunIcon,
  },
  {
    key: "dark",
    name: "Sombre",
    icon: MoonIcon,
  },
  {
    key: "system",
    name: "Système",
    icon: MonitorIcon,
  },
];

interface ThemeSwitcherProps {
  className?: string;
}

export function ThemeSwitcher({ className }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon" className={className}>
            {theme === "light" && <SunIcon className="size-5" />}
            {theme === "dark" && <MoonIcon className="size-5" />}
            {theme === "system" && (
              <>
                <SunIcon className="size-5 dark:hidden" />
                <MoonIcon className="hidden size-5 dark:block" />
              </>
            )}
          </Button>
        }
      />
      <DropdownMenuContent className="w-40" align="end">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Thème</DropdownMenuLabel>
          {themes.map(({ key, name, icon: Icon }) => (
            <DropdownMenuCheckboxItem
              key={key}
              checked={key === theme}
              onCheckedChange={() => setTheme(key)}
            >
              <Icon className="size-4" />
              {name}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ThemeSwitcherDropdownMenuGroup() {
  const { theme, setTheme } = useTheme();

  return (
    <DropdownMenuGroup>
      <DropdownMenuLabel>Thème</DropdownMenuLabel>
      {themes.map(({ key, name, icon: Icon }) => (
        <DropdownMenuCheckboxItem
          key={key}
          checked={key === theme}
          onCheckedChange={() => setTheme(key)}
        >
          <Icon className="size-4" />
          {name}
        </DropdownMenuCheckboxItem>
      ))}
    </DropdownMenuGroup>
  );
}

function getTheme(): Theme {
  return (document.documentElement.dataset.theme as Theme) || "system";
}

function applyTheme(theme: Theme) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const isDark = theme === "dark" || (theme === "system" && media.matches);

  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", isDark);
}

function setTheme(theme: Theme) {
  localStorage.setItem("theme", theme);
  applyTheme(theme);
  window.dispatchEvent(new Event("themechange"));
}

function subscribe(callback: () => void) {
  window.addEventListener("themechange", callback);

  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const listener = () => {
    if (getTheme() === "system") {
      applyTheme("system");
      callback();
    }
  };

  media.addEventListener("change", listener);

  return () => {
    window.removeEventListener("themechange", callback);
    media.removeEventListener("change", listener);
  };
}

const ThemeContext = createContext<{ setTheme: (t: Theme) => void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <ThemeContext.Provider value={{ setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");

  const theme = useSyncExternalStore(subscribe, getTheme, () => "system");

  return { theme, setTheme: ctx.setTheme };
}
