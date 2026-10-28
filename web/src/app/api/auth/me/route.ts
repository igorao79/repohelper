import { type NextRequest, NextResponse, connection } from "next/server";

import { authConfigured, readSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  await connection(); // ответ зависит от cookie конкретного запроса — не пререндерить
  return NextResponse.json(
    { user: readSession(req), configured: authConfigured() },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
