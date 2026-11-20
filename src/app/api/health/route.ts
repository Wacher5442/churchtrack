import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const userCount = await db.user.count();
    const config = await db.appConfig.findUnique({ where: { id: 1 } });
    return NextResponse.json({
      ok: true,
      userCount,
      configExists: !!config,
      dbUrl: process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ":***@"),
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      error: String(err),
      dbUrl: process.env.DATABASE_URL?.replace(/:([^:@]+)@/, ":***@"),
    }, { status: 500 });
  }
}
