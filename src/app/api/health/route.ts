import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const started = Date.now();

  try {
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        db: "ok",
        instance: process.env.INSTANCE_ID ?? "unknown",
        uptime: Math.round(process.uptime()),
        dbMs: Date.now() - started,
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        db: "down",
        instance: process.env.INSTANCE_ID ?? "unknown",
        message: error instanceof Error ? error.message : "unknown error",
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
}
