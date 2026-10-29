import { type NextRequest, NextResponse } from "next/server";

import { readApiKey } from "@/lib/auth";
import { handleRpc, type JsonRpcResponse, rpcError } from "@/lib/mcp";

export const maxDuration = 30;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, X-API-Key, Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: CORS });

/**
 * POST /api/mcp — MCP-сервер (Streamable HTTP, без сессий).
 * Ключ тот же, что для API: Authorization: Bearer rh_…, X-API-Key или ?key= для клиентов без заголовков.
 */
export async function POST(req: NextRequest) {
  if (!readApiKey(req)) {
    return json(
      rpcError(null, -32001, "Нужен ключ repohelper: заголовок Authorization: Bearer rh_… или ?key=rh_… в адресе. Ключ: repohelper.site/developers"),
      401,
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return json(rpcError(null, -32700, "Parse error"), 400);
  }

  const run = async (msg: unknown): Promise<JsonRpcResponse | null> => {
    try {
      return await handleRpc(msg);
    } catch (e) {
      console.error("mcp", e);
      return rpcError((msg as { id?: string | number })?.id ?? null, -32603, "Внутренняя ошибка сервера");
    }
  };

  if (Array.isArray(body)) {
    const replies = (await Promise.all(body.map(run))).filter((r) => r !== null);
    return replies.length ? json(replies) : new NextResponse(null, { status: 202, headers: CORS });
  }
  const reply = await run(body);
  return reply ? json(reply) : new NextResponse(null, { status: 202, headers: CORS });
}

// Сервер ничего не присылает сам и сессий не держит — поток GET и DELETE сессии не нужны.
const notAllowed = () =>
  new NextResponse(null, { status: 405, headers: { ...CORS, Allow: "POST, OPTIONS" } });
export const GET = notAllowed;
export const DELETE = notAllowed;

export const OPTIONS = () => new NextResponse(null, { status: 204, headers: CORS });
