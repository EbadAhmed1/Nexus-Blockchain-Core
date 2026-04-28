"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { useEffect } from "react"
import { useAppStore } from "@/store/app-store"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const { theme: storedTheme, setTheme: setStoredTheme } = useAppStore((state) => ({
    theme: state.theme,
    setTheme: state.setTheme,
  }))

  useEffect(() => {
    if (storedTheme && storedTheme !== theme) {
      setTheme(storedTheme)
    }
  }, [storedTheme, theme, setTheme])

  const toggleTheme = () => {
    const nextTheme = (theme ?? "dark") === "dark" ? "light" : "dark"
    setStoredTheme(nextTheme as "light" | "dark")
    setTheme(nextTheme)
  }

  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
    </Button>
  )
}

