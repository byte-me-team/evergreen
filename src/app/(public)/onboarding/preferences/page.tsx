"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { useOnboarding } from "@/components/onboarding/onboarding-provider";
import { Button } from "@/components/ui/button";
import { TagInput, TagInputHandle } from "@/components/forms/tag-input";
import { Sparkles } from "lucide-react";

type Stage = 1 | 2 | 3;

export default function OnboardingPreferencesPage() {
  const router = useRouter();
  const { state, updatePreferences } = useOnboarding();
  const { status } = useSession();
  const enjoyInputRef = useRef<TagInputHandle>(null);
  const dislikeInputRef = useRef<TagInputHandle>(null);
  const [stage, setStage] = useState<Stage>(1);

  useEffect(() => {
    if (!state.basicInfo.email) {
      router.replace("/onboarding");
    }
  }, [state.basicInfo.email, router]);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [status, router]);

  const stageCopy = useMemo(
    () => ({
      1: {
        title: "What brings joy?",
      },
      2: {
        title: "What should we avoid?",
      },
      3: {
        title: "Tune the logistics",
      },
    }),
    []
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    enjoyInputRef.current?.commitPending();
    dislikeInputRef.current?.commitPending();
    router.push("/onboarding/summary");
  };

  const handleAdvance = () => {
    if (stage === 1) {
      enjoyInputRef.current?.commitPending();
      setStage(2);
    } else if (stage === 2) {
      dislikeInputRef.current?.commitPending();
      setStage(3);
    }
  };

  const handleBack = () => {
    if (stage === 1) {
      router.push("/onboarding");
    } else {
      setStage((prev) => (prev - 1) as Stage);
    }
  };

  return (
    <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-1 sm:py-10">
      <section className="w-full max-w-4xl space-y-8 rounded-[40px] border border-primary/25 bg-card/70 px-5 py-4 shadow-2xl shadow-primary/20 backdrop-blur sm:px-8 sm:py-8">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-3 rounded-full border border-primary/40 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-primary">
            <Sparkles className="h-4 w-4 text-primary motion-safe:animate-[pulse_4s_ease-in-out_infinite]" />
            Step 2 of 3
          </div>
          <h1 className="text-3xl font-semibold sm:text-4xl">
            {stageCopy[stage].title}
          </h1>
        </div>
        <form className="mx-auto flex w-full max-w-3xl flex-col gap-8" onSubmit={handleSubmit}>
          {stage === 1 && (
            <div className="space-y-6 rounded-[32px] border border-border/70 bg-card/80 p-6 shadow-lg shadow-primary/10">
              <TagInput
                ref={enjoyInputRef}
                label="Things you enjoy doing"
                description={null}
                placeholder="Knitting · Local markets · Stroll with family"
                items={state.preferences.enjoyList}
                onChange={(next) => updatePreferences({ enjoyList: next })}
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={() => enjoyInputRef.current?.commitPending()}
                >
                  Add preference
                </Button>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleAdvance}>
                    Next preference
                  </Button>
                </div>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div className="space-y-6 rounded-[32px] border border-border/70 bg-card/80 p-6 shadow-lg shadow-primary/10">
              <TagInput
                ref={dislikeInputRef}
                label="Things you do not like"
                description={null}
                placeholder="Crowded malls or long queues"
                items={state.preferences.dislikeList}
                onChange={(next) => updatePreferences({ dislikeList: next })}
                tone="destructive"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  className="text-sm text-muted-foreground hover:text-primary"
                  onClick={() => dislikeInputRef.current?.commitPending()}
                >
                  Add dislike
                </Button>
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                  <Button type="button" onClick={handleAdvance}>
                    Next settings
                  </Button>
                </div>
              </div>
            </div>
          )}

          {stage === 3 && (
            <div className="space-y-6 rounded-[32px] border border-border/70 bg-card/80 p-6 shadow-lg shadow-primary/10">
              <div className="space-y-4">
                <label className="text-sm font-medium">
                  How far are you willing to travel?
                </label>
                <div className="space-y-4">
                  <div className="relative h-8">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 rounded-full bg-border/50">
                      <div
                        className="h-2 rounded-full bg-primary/60"
                        style={{
                          width: `${((state.preferences.travelDistanceKm - 1) / 39) * 100}%`,
                        }}
                      />
                    </div>
                    <div
                      className="absolute top-1/2 -translate-y-1/2 rounded-full border border-background bg-primary p-2 shadow-lg shadow-primary/40 transition"
                      style={{
                        left: `calc(${((state.preferences.travelDistanceKm - 1) / 39) * 100}% - 14px)`,
                      }}
                    />
                    <input
                      type="range"
                      min={1}
                      max={40}
                      value={state.preferences.travelDistanceKm}
                      onChange={(event) =>
                        updatePreferences({
                          travelDistanceKm: Number(event.target.value),
                        })
                      }
                      className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    />
                  </div>
                  <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    {state.preferences.travelDistanceKm} km
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Preferred time of day
                  </label>
                  <select
                    className="border-input bg-transparent h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={state.preferences.preferredTime}
                    onChange={(event) =>
                      updatePreferences({
                        preferredTime:
                          event.target.value as typeof state.preferences.preferredTime,
                      })
                    }
                  >
                    <option value="any">No preference</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    How social do you prefer activities to be?
                  </label>
                  <select
                    className="border-input bg-transparent h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={state.preferences.socialPreference}
                    onChange={(event) =>
                      updatePreferences({
                        socialPreference:
                          event.target.value as typeof state.preferences.socialPreference,
                      })
                    }
                  >
                    <option value="any">I'm flexible</option>
                    <option value="alone">Just me</option>
                    <option value="small_group">Small group</option>
                    <option value="family">With family</option>
                  </select>
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium">
                    Do you like to try new things?
                  </label>
                  <select
                    className="border-input bg-transparent h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                    value={state.preferences.adventurous}
                    onChange={(event) =>
                      updatePreferences({
                        adventurous:
                          event.target.value as typeof state.preferences.adventurous,
                      })
                    }
                  >
                    <option value="yes">Yes, bring it on</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="no">Prefer the familiar</option>
                  </select>
                </div>
              </div>
              <div className="flex flex-wrap justify-end gap-3">
                <Button type="button" variant="outline" onClick={handleBack}>
                  Back
                </Button>
                <Button type="submit" className="shadow-lg shadow-primary/30">
                  Save preferences
                </Button>
              </div>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
