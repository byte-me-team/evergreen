import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("userId");
  const relativeId = url.searchParams.get("relativeId");
  const matchId = url.searchParams.get("matchId");

  if (!matchId && (!userId || !relativeId)) {
    return NextResponse.json(
      { error: "userId and relativeId are required" },
      { status: 400 }
    );
  }

  try {
    const match = matchId
      ? await prisma.match.findUnique({
          where: { id: matchId },
        })
      : await prisma.match.findFirst({
          where: { userId: userId!, relativeId: relativeId! },
          orderBy: { createdAt: "desc" },
        });

    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    const suggestions = (match.suggestionsJson as
      | { activities?: unknown[] }
      | null)?.activities;

    return NextResponse.json({
      match,
      activities: Array.isArray(suggestions) ? suggestions : [],
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to load match" },
      { status: 500 }
    );
  }
}
