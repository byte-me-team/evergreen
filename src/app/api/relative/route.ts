import { NextResponse } from "next/server";
import {prisma} from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId, name, rawText } = await req.json();

    if (!userId || !rawText || !name) {
      return NextResponse.json(
        { error: "Missing userId or rawText or name" },
        { status: 400 }
      );
    }

    const normalizedJson = { rawText };

    const prefs = await prisma.relative.create({
      data: {
        userId,
        name,
        rawText
      },
    });

    return NextResponse.json(prefs);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const relatives = await prisma.relative.findMany({
      where: { userId }
    });

    return NextResponse.json(relatives);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}