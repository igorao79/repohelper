import { type NextRequest, NextResponse } from "next/server";

import { readGithubToken, readSession } from "@/lib/auth";
import { GitHubError } from "@/lib/github";
import { type StudioEvent, type StudioTurn, runStudio } from "@/lib/studio";

export const maxDuration = 60;

const MAX_TEXT = 1500;
const MAX_IMAGES = 3;
const MAX_IMAGE_CHARS = 3_000_000; // ~2.2 МБ картинки в base64
const IMAGE_RE = /^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/;

/** Студия: POST {messages}, ответ — поток NDJSON: status… и в конце result или error. */
export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && origin !== req.nextUrl.origin && origin !== process.env.SITE_URL?.replace(/\/$/, "")) {
    return NextResponse.json({ error: "Запрос не с сайта repohelper" }, { status: 403 });
  }
  if (!readSession(req)) return NextResponse.json({ error: "Войдите через GitHub" }, { status: 401 });
  if (!process.env.DEEPSEEK_API_KEY) return NextResponse.json({ error: "Студия ещё не настроена" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as { messages?: StudioTurn[]; images?: unknown } | null;
  const turns = (body?.messages ?? [])
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.text === "string")
    .slice(-8)
    .map((m) => ({ role: m.role, text: m.text.slice(0, MAX_TEXT), repos: m.repos?.slice(0, 8) }));
  const images = Array.isArray(body?.images) ? body.images.filter((u): u is string => typeof u === "string") : [];
  if (images.length > MAX_IMAGES || images.some((u) => u.length > MAX_IMAGE_CHARS || !IMAGE_RE.test(u))) {
    return NextResponse.json({ error: `До ${MAX_IMAGES} картинок PNG, JPEG или WebP, каждая до 2 МБ` }, { status: 400 });
  }
  if (turns.at(-1)?.role !== "user" || (!turns.at(-1)?.text.trim() && !images.length)) {
    return NextResponse.json({ error: "Пустой запрос" }, { status: 400 });
  }

  const token = readGithubToken(req) ?? process.env.GITHUB_TOKEN ?? null;
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: StudioEvent) => controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
      try {
        await runStudio(turns, token, emit, images);
      } catch (e) {
        emit({
          type: "error",
          text: e instanceof GitHubError ? e.message : "Не получилось подобрать репозитории. Попробуйте ещё раз.",
        });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" },
  });
}
