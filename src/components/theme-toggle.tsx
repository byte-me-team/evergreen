"use client"

import * as React from "react"
import { Moon, Sun, Contrast } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ModeToggle() {
    const { setTheme } = useTheme()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    className="relative flex items-center gap-2 rounded-full border border-primary/20 px-4 py-2 text-base font-semibold text-foreground shadow-sm shadow-primary/20 transition hover:border-primary/60 hover:-translate-y-0.5"
                >
                    <div className="relative flex items-center justify-center">
                        <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 opacity-100 transition-all dark:scale-0 dark:-rotate-90 dark:opacity-0 contrast:scale-0 contrast:-rotate-90 contrast:opacity-0" />
                        <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 opacity-0 transition-all dark:scale-100 dark:rotate-0 dark:opacity-100" />
                        <Contrast className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 opacity-0 transition-all contrast:scale-100 contrast:rotate-0 contrast:opacity-100" />
                    </div>
                    <span className="text-sm uppercase tracking-wide text-primary/80">
                        Mode
                    </span>
                    <span className="sr-only">Toggle theme</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("contrast")}>
                    High contrast
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
