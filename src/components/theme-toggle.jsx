

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const isDark = theme === "dark";

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={
        isDark
          ? "Switch to light mode"
          : "Switch to dark mode"
      }
      className="size-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
    >
      {isDark ? (
        <Sun className="size-4.5" />
      ) : (
        <Moon className="size-4.5" />
      )}
    </Button>
  );
}

