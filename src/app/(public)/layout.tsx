"use client";

import { PropsWithChildren } from "react";

import { MarketingHeader } from "@/components/layout/marketing-header";

export default function PublicLayout({ children }: PropsWithChildren) {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <MarketingHeader />
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="w-full border-t border-border/60 bg-card/70 px-6 py-4 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Byte Me Team — lovingly crafted at Junction
      </footer>
    </div>
  );
}
