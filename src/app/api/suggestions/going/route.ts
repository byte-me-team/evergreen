import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      suggestionId?: string;
      isGoing?: boolean;
    };
    const suggestionId = body.suggestionId;
    const isGoing = body.isGoing ?? true;

    if (!suggestionId) {
      return NextResponse.json(
        { error: "suggestionId is required" },
        { status: 400 }
      );
    }

    const suggestion = await prisma.matchedSuggestion.findUnique({
      where: { id: suggestionId },
      select: { id: true, userId: true },
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (suggestion.userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.matchedSuggestion.update({
      where: { id: suggestionId },
      data: {
        isGoing,
      },
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("[Suggestions][going] Failed to update selection", error);
    return NextResponse.json(
      { error: "Failed to update selection" },
      { status: 500 }
    );
  }
}
