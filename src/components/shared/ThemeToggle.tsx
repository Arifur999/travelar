"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Both icons are always rendered and CSS picks the visible one off the `.dark`
 * class on <html>.
 *
 * The usual next-themes dance — a `mounted` flag set in an effect — exists to
 * avoid a hydration mismatch, because the resolved theme is unknown on the
 * server. Letting CSS decide sidesteps that entirely: the markup is identical
 * on both sides, so there is nothing to mismatch, no setState in an effect, and
 * no flash of the wrong icon. `resolvedTheme` is read only inside the click
 * handler, which never runs on the server.
 */
const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      // Static, because which theme is active is unknown at render time and a
      // label that flips would be announced wrongly on first paint.
      aria-label="Toggle theme"
    >
      <Sun className="size-4 dark:hidden" aria-hidden="true" />
      <Moon className="hidden size-4 dark:block" aria-hidden="true" />
    </Button>
  );
};

export default ThemeToggle;
