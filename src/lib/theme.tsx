import { ScriptOnce } from "@tanstack/react-router";
import { createClientOnlyFn, createIsomorphicFn } from "@tanstack/react-start";
import { createContext, use, useEffect, useState } from "react";
import { z } from "zod/mini";

// CONST -----------------------------------------------------------------------------------------------------------------------------------
const themeStorageKey = "ui-theme";

// SCHEMAS ---------------------------------------------------------------------------------------------------------------------------------
const zUserTheme = z.catch(z.enum(["light", "dark", "system"]), "system");
const zAppTheme = z.catch(z.enum(["light", "dark"]), "light");

export type UserTheme = z.infer<typeof zUserTheme>;
export type AppTheme = z.infer<typeof zAppTheme>;

// ISOMORPHIC FUNCTIONS --------------------------------------------------------------------------------------------------------------------
const getStoredUserTheme = createIsomorphicFn()
  .server((): UserTheme => "system")
  .client((): UserTheme => zUserTheme.parse(localStorage.getItem(themeStorageKey)));

const getSystemTheme = createIsomorphicFn()
  .server((): AppTheme => "light")
  .client((): AppTheme => (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));

// CLIENT FUNCTIONS ------------------------------------------------------------------------------------------------------------------------
const handleThemeChange = createClientOnlyFn((userTheme: UserTheme) => {
  const validatedTheme = zUserTheme.parse(userTheme);
  const classes = document.documentElement.classList;
  classes.remove("light", "dark", "system");
  classes.add(...(validatedTheme === "system" ? [getSystemTheme(), "system"] : [validatedTheme]));
});

const setStoredTheme = createClientOnlyFn((theme: UserTheme) => localStorage.setItem(themeStorageKey, zUserTheme.parse(theme)));

const setupPreferredListener = createClientOnlyFn(() => {
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = () => handleThemeChange("system");
  mediaQuery.addEventListener("change", handler);
  return () => mediaQuery.removeEventListener("change", handler);
});

// SCRIPT ----------------------------------------------------------------------------------------------------------------------------------
const themeScript = (() => {
  function themeFn() {
    const classes = document.documentElement.classList;
    const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    try {
      const storedTheme = localStorage.getItem("ui-theme") ?? "system";
      const validTheme = ["light", "dark", "system"].includes(storedTheme) ? storedTheme : "system";
      classes.add(validTheme === "system" ? systemTheme : validTheme);
    } catch {
      classes.add(systemTheme, "system");
    }
  }
  return `(${themeFn.toString()})();`;
})();

// CONTEXT ---------------------------------------------------------------------------------------------------------------------------------
const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);
type ThemeContextProps = {
  userTheme: UserTheme;
  appTheme: AppTheme;
  setTheme: (theme: UserTheme) => void;
};

// PROVIDER --------------------------------------------------------------------------------------------------------------------------------
export function ThemeProvider({ children }: ThemeProviderProps) {
  const [userTheme, setUserTheme] = useState<UserTheme>(getStoredUserTheme);

  useEffect(() => {
    if (userTheme !== "system") return;
    return setupPreferredListener();
  }, [userTheme]);

  const appTheme = userTheme === "system" ? getSystemTheme() : userTheme;

  const setTheme = (newUserTheme: UserTheme) => {
    const validatedTheme = zUserTheme.parse(newUserTheme);
    setUserTheme(validatedTheme);
    setStoredTheme(validatedTheme);
    handleThemeChange(validatedTheme);
  };

  return (
    <ThemeContext value={{ userTheme, appTheme, setTheme }}>
      <ScriptOnce>{themeScript}</ScriptOnce>
      {children}
    </ThemeContext>
  );
}
type ThemeProviderProps = { children: React.ReactNode };

// HOOK ------------------------------------------------------------------------------------------------------------------------------------
export const useTheme = () => {
  const context = use(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
