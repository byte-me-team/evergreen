"use client";

import { OnboardingProvider } from "@/components/onboarding/onboarding-provider";
import { MarketingHeader } from "@/components/layout/marketing-header";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingProvider>
      <div className="relative isolate flex min-h-screen flex-col overflow-hidden bg-background text-foreground">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="pointer-events-none absolute -left-24 top-32 -z-10 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-10 -z-10 h-72 w-72 rounded-full bg-secondary/30 blur-[110px]" />
        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col px-4 pb-16 pt-8 sm:px-6 lg:px-8">
          {children}
        </div>
      </div>
    </OnboardingProvider>
  );
}
