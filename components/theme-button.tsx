"use client";

import { Sun } from "lucide-react";
import { Moon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";

export function ThemeButton() {
  const { theme, setTheme } = useTheme();

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        <Sun className="block dark:hidden" strokeWidth={2} />
        <Moon className="hidden dark:block" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    </>
  );
}
