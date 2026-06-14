import Anthropic from "@anthropic-ai/sdk";

export function hasApiKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

export interface CompleteArgs {
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

/** Single-turn completion returning the assistant's text. */
export async function complete({ model, system, user, maxTokens = 4096, temperature }: CompleteArgs): Promise<string> {
  const res = await getClient().messages.create({
    model,
    max_tokens: maxTokens,
    // Some models (e.g. Opus 4.8) reject `temperature`; only send it when set.
    ...(temperature != null ? { temperature } : {}),
    system,
    messages: [{ role: "user", content: user }],
  });
  return res.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/** Extract the first JSON object/array from a model response (handles fenced code). */
export function parseJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.search(/[{[]/);
  if (start === -1) throw new Error("No JSON found in model response");
  // Balance brackets (ignoring those inside strings) to trim trailing prose.
  const open = raw[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inStr = false;
  let esc = false;
  let end = -1;
  for (let i = start; i < raw.length; i++) {
    const ch = raw[i];
    if (inStr) {
      if (esc) esc = false;
      else if (ch === "\\") esc = true;
      else if (ch === '"') inStr = false;
      continue;
    }
    if (ch === '"') inStr = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) { end = i + 1; break; }
    }
  }
  const sliced = end === -1 ? raw.slice(start) : raw.slice(start, end);
  return JSON.parse(sliced) as T;
}
