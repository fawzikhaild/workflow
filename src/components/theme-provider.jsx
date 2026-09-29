

import { createContext, useContext, useEffect, useState } from "react";

const ThemeProviderContext = createContext({
  theme: "dark",
  setTheme: () => null,
});

function getStoredTheme(storageKey, defaultTheme) {
  try {
    const storedTheme = localStorage.getItem(storageKey);

    if (storedTheme === "light" || storedTheme === "dark") {
      return storedTheme;
    }
  } catch (error) {
    console.error("Unable to read theme preference:", error);
  }

  return defaultTheme;
}

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "workflow-theme",
}) {
  const [theme, setThemeState] = useState(() =>
    getStoredTheme(storageKey, defaultTheme)
  );

  useEffect(() => {
    const root = document.documentElement;

    root.classList.remove("light", "dark");
    root.classList.add(theme);

    root.style.colorScheme = theme;

    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      console.error("Unable to save theme preference:", error);
    }
  }, [theme, storageKey]);

  const setTheme = (nextTheme) => {
    if (nextTheme !== "light" && nextTheme !== "dark") {
      return;
    }

    setThemeState(nextTheme);
  };

  return (
    <ThemeProviderContext.Provider
      value={{
        theme,
        setTheme,
      }}
    >
      {children}
    </ThemeProviderContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeProviderContext);
}


