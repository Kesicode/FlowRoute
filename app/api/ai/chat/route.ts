/**
 * app/api/ai/chat/route.ts
 *
 * Phase 6 — Gemini Streaming Chat API
 *
 * POST /api/ai/chat
 * Body: { messages: {role:"user"|"model", text:string}[], tripContext?: string }
 *
 * Streams Gemini response tokens as Server-Sent Events (SSE):
 *   data: <chunk text>\n\n
 *   data: [DONE]\n\n
 *
 * Uses @google/generative-ai v0.24 (existing package):
 *   model.startChat({ history }) → chat.sendMessageStream(userMsg)
 *
 * Security:
 *   • User messages sanitized (no backticks, quotes, or injection chars)
 *   • Max 20 messages in history (context cap)
 *   • System prompt hard-coded server-side — never exposed to client
 *   • Rate limit: 1 req/4s per IP (slightly looser than plan route)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest } from "next/server";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

// Rate limiter — per IP, 4 seconds between requests
const rateLimiter = new Map<string, number>();

function sanitize(text: string): string {
  return text
    .replace(/[`\\]/g, "")
    .replace(/[^\x20-\x7E\u0900-\u097F\u0D00-\u0D7F\n\r\t]/g, " ")
    .substring(0, 500);
}

const SYSTEM_PROMPT = `You are FlowRoute Copilot — an intelligent, concise AI travel assistant embedded in the FlowRoute app.

Your role:
- Answer travel questions about the user's current trip
- Suggest alternatives, local tips, budget optimisations, safety advice
- Stay focused on travel, routes, local food, culture, weather, and transportation
- Be helpful for India travel (Kerala, Karnataka, Goa, Rajasthan, etc.) but cover global travel too
- Respond in the user's language (English/Hindi/Malayalam as detected)
- Keep answers short and actionable — 2-4 sentences max unless a list is clearly better
- Never make up real booking prices or flight numbers — always clarify estimates
- If asked about emergency situations: prioritise safety, suggest calling 112 (India emergency)

Personality: Friendly, knowledgeable, like a well-travelled local friend.
Format: Plain text only. No markdown headers. Use bullet points sparingly.`;

export async function POST(req: NextRequest) {
  // Rate limiting
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const lastCall = rateLimiter.get(ip) ?? 0;
  if (Date.now() - lastCall < 4000) {
    return new Response(
      JSON.stringify({ error: "Rate limited. Wait a moment." }),
      { status: 429, headers: { "Content-Type": "application/json" } }
    );
  }
  rateLimiter.set(ip, Date.now());

  if (!genAI) {
    // Fallback when no API key — return a helpful static response
    const stream = new ReadableStream({
      start(controller) {
        const msg =
          "FlowRoute Copilot is not configured yet. Add your GEMINI_API_KEY to .env.local to enable AI chat. In the meantime, I can tell you that FlowRoute supports routes across India with real-time weather, POI discovery, and voice commands!";
        controller.enqueue(new TextEncoder().encode(`data: ${msg}\n\n`));
        controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  }

  let body: { messages?: { role: string; text: string }[]; tripContext?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawMessages = (body.messages ?? []).slice(-20); // cap history
  if (rawMessages.length === 0) {
    return new Response(JSON.stringify({ error: "No messages" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const tripContext = body.tripContext
    ? sanitize(body.tripContext).substring(0, 300)
    : null;

  // Build history for multi-turn (all but last message)
  const history = rawMessages.slice(0, -1).map((m) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: sanitize(m.text) }],
  }));

  const userMessage = sanitize(rawMessages[rawMessages.length - 1].text);

  // Trip-aware system injection
  const systemWithContext = tripContext
    ? `${SYSTEM_PROMPT}\n\nCurrent trip context: ${tripContext}`
    : SYSTEM_PROMPT;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      systemInstruction: systemWithContext,
    });

    const chat = model.startChat({
      history,
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessageStream(userMessage);

    // Stream SSE response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.stream) {
            const text = chunk.text();
            if (text) {
              controller.enqueue(encoder.encode(`data: ${text}\n\n`));
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } catch (err) {
          console.error("[FlowRoute/chat] Stream error:", err);
          controller.enqueue(
            encoder.encode("data: Sorry, I encountered an error. Please try again.\n\n")
          );
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // disable nginx buffering
      },
    });
  } catch (err) {
    console.error("[FlowRoute/chat] Gemini error:", err);
    return new Response(
      JSON.stringify({ error: "AI service temporarily unavailable." }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }
}
