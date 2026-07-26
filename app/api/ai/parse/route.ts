import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextRequest, NextResponse } from "next/server";
import { ParsedQuerySchema } from "@/lib/schemas";

const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

export async function POST(req: NextRequest) {
  if (!genAI) {
    return NextResponse.json({ error: "AI not configured" }, { status: 503 });
  }

  try {
    const { query } = await req.json();
    const safeQuery = String(query ?? "").replace(/[`"\\]/g, "").substring(0, 500);

    const prompt = `You are the NLU query parser for FlowRoute, an AI-powered inclusive smart mobility assistant.
Analyze the user's search query and extract structured fields:
User request: "${safeQuery}"

Map preferences to these allowed values: "elderly", "family", "baby", "wheelchair", "budget", "fastest", "eco", "foodie", "tourist", "backpacker".
Set "safetyMode" to true if user mentions terms like "safety", "safe", "secure", "women's safety", "alone", "night".

Output strictly a JSON object with:
{"from": "origin name","to": "destination name","budget": number or null,"travellers": number or null,"preferences": ["pref1"],"safetyMode": boolean}

Ensure valid JSON and no code block formatting. Only output the JSON.`;

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text().replace(/```json/g, "").replace(/```/g, "").trim();

    const parsed = ParsedQuerySchema.safeParse(JSON.parse(text));
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed" }, { status: 422 });
    }

    return NextResponse.json(parsed.data);
  } catch (e) {
    console.error("AI parse route error:", e);
    return NextResponse.json({ error: "AI parse failed" }, { status: 500 });
  }
}
