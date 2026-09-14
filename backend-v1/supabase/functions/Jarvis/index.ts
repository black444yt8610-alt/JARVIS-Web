import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json"
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: cors });

const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SECRET_KEYS = Deno.env.get("SUPABASE_SECRET_KEYS");

if (!GEMINI_API_KEY) console.warn("GEMINI_API_KEY is not configured.");

function getAdminClient() {
  if (!SUPABASE_URL || !SUPABASE_SECRET_KEYS) throw new Error("Supabase server configuration is missing.");
  const keys = JSON.parse(SUPABASE_SECRET_KEYS);
  return createClient(SUPABASE_URL, keys.default);
}

function systemPrompt(memories: string[]) {
  const memoryBlock = memories.length
    ? `Known user memories:\n${memories.map((m, i) => `${i + 1}. ${m}`).join("\n")}`
    : "Known user memories: none.";

  return `You are JARVIS, a concise, helpful personal AI assistant.
Be accurate and transparent. Do not claim to have performed an action unless a tool actually did it.
Keep responses suitable for a general audience.
${memoryBlock}`;
}

async function callGemini(message: string, memories: string[]) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured.");

  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(memories) }] },
      contents: [{ role: "user", parts: [{ text: message }] }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 700
      }
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const detail = data?.error?.message || `Gemini HTTP ${response.status}`;
    throw new Error(detail);
  }

  const text = data?.candidates?.[0]?.content?.parts
    ?.map((p: { text?: string }) => p.text || "")
    .join("")
    .trim();

  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "Use POST." }, 405);

  try {
    const body = await req.json();
    const message = String(body?.message || "").trim();
    const sessionId = String(body?.session_id || "").trim();
    const action = String(body?.action || "chat");

    if (!message && action !== "memory_list") return json({ error: "message is required." }, 400);
    if (!sessionId) return json({ error: "session_id is required." }, 400);
    if (sessionId.length > 100) return json({ error: "Invalid session_id." }, 400);

    const supabase = getAdminClient();

    if (action === "memory_add") {
      if (message.length > 2000) return json({ error: "Memory is too long." }, 400);
      const { error } = await supabase.from("jarvis_memory").insert({
        session_id: sessionId,
        content: message
      });
      if (error) throw error;
      return json({ reply: "Saved that to my long-term memory.", source: "memory" });
    }

    if (action === "memory_list") {
      const { data, error } = await supabase
        .from("jarvis_memory")
        .select("content,created_at")
        .eq("session_id", sessionId)
        .order("created_at", { ascending: false })
        .limit(30);
      if (error) throw error;
      return json({ memories: data || [], source: "memory" });
    }

    const { data: memoryRows, error: memoryError } = await supabase
      .from("jarvis_memory")
      .select("content")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (memoryError) throw memoryError;

    const memories = (memoryRows || []).map((r: { content: string }) => r.content);
    const reply = await callGemini(message, memories);

    // Explicit "remember ..." requests are saved automatically.
    const remember = message.match(/^(remember|save|memorize)\s+(that\s+)?(.+)/i);
    if (remember) {
      await supabase.from("jarvis_memory").insert({
        session_id: sessionId,
        content: remember[3].trim()
      });
    }

    return json({ reply, source: "gemini", model: MODEL });
  } catch (error) {
    console.error(error);
    return json({ error: error instanceof Error ? error.message : "Unexpected server error." }, 500);
  }
});
