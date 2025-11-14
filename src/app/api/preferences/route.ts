import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { saveUserPreferences } from "@/lib/services";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, rawText } = body as {
      email?: string;
      name?: string;
      rawText?: string;
    };

    if (!email || !rawText) {
      return NextResponse.json(
        { error: "email and rawText are required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.upsert({
      where: { email },
      create: {
        email,
        name: name ?? null,
      },
      update: {
        name: name ?? undefined,
      },
    });

    const prefs = await saveUserPreferences(user.id, rawText);

    return NextResponse.json(
      {
        userId: user.id,
        userEmail: user.email,
        preferences: prefs,
      },
      { status: 200 }
    );
  } catch (err: any) {
    console.error("POST /api/preferences error:", err);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}

