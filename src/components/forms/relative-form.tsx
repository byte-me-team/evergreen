"use client";

import { TagInput } from "./tag-input";
import { FormEvent, useState, useRef, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useRouter } from "next/navigation";

type RelativesFormProps = {
  className?: string;
  userId: string;
  name: string;
  buttonLabel?: string;
  footer?: ReactNode;
};

export function RelativesForm({
  className,
  userId,
  name,
  buttonLabel = "Save Preferences",
  footer,
}: RelativesFormProps) {

  const router = useRouter();

  const [preferences, setPreferences] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState<string[]>([]);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const enjoyInputRef = useRef(null);
  const dislikeInputRef = useRef(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (preferences.length === 0 && dislikes.length === 0) {
      setError("Please add at least one preference.");
      return;
    }

    setError(null);

    try {
      const res = await fetch("/api/relative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          name,
          preferences,
          dislikes
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError("Failed to save preferences");
    }
  };

  return (
    <Card className={cn("max-w-lg mx-auto", className)}>
      <CardHeader>
        <CardTitle>Enter Your Preferences</CardTitle>
      </CardHeader>

      <CardContent>
        {success ? (
          <p className="text-green-600 font-medium text-center">
            Thank you for submitting your preferences!
          </p>
        ) : (
          <form className="space-y-8" onSubmit={handleSubmit}>
            
            <TagInput
              ref={enjoyInputRef}
              label="Things you enjoy"
              description="Enter as many as you want"
              placeholder="Local markets · Strolls with family"
              items={preferences}
              onChange={setPreferences}
            />

            <TagInput
              ref={dislikeInputRef}
              label="Things you don't like"
              placeholder="Crowds · Cycling"
              items={dislikes}
              onChange={setDislikes}
            />

            <div className="flex items-center justify-between">
              <Button type="submit">{buttonLabel}</Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
