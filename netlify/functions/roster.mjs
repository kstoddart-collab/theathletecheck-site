// Bolles Leaders — "Are you in?" roster
// GET  /.netlify/functions/roster -> { inCount, outCount, total }   (+ entries with ?key=)
// POST { name, answer: "yes" | "no" } -> records the answer and emails Kenny
import { getStore } from "@netlify/blobs";

const KEY = "are-you-in";
const MAX_ENTRIES = 400;
const MAX_NAME = 40;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const clean = (s) =>
  String(s || "")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_NAME);

// The page only ever sees counts. Names stay private to the coach.
function publicView(entries) {
  return {
    inCount: entries.filter((e) => e.answer === "yes").length,
    outCount: entries.filter((e) => e.answer === "no").length,
    total: entries.length,
  };
}

async function read(store) {
  const raw = await store.get(KEY, { type: "json" });
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e) => e && typeof e.name === "string" && (e.answer === "yes" || e.answer === "no"))
    .slice(-MAX_ENTRIES);
}

// Fire a Netlify Forms submission so Kenny gets an email for every answer.
async function notify(entry, counts) {
  const site = process.env.URL;
  if (!site) return;
  const body = new URLSearchParams({
    "form-name": "roster-signup",
    "Player name": entry.name,
    Answer: entry.answer === "yes" ? "IN" : "Not this time",
    When: entry.at,
    "Running total in": String(counts.inCount),
  }).toString();
  try {
    await fetch(site + "/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    // never let a notification failure break the sign-up
  }
}

export default async (req) => {
  const store = getStore({ name: "bolles-poll", consistency: "strong" });

  if (req.method === "GET") {
    const entries = await read(store);
    const key = new URL(req.url).searchParams.get("key");
    const secret = process.env.ROSTER_KEY;
    if (key && secret && key === secret) {
      return json({
        ...publicView(entries),
        entries: entries.map((e) => ({ name: e.name, answer: e.answer, at: e.at })),
      });
    }
    return json(publicView(entries));
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const name = clean(body?.name);
  const answer = body?.answer === "yes" ? "yes" : body?.answer === "no" ? "no" : null;
  if (name.length < 2 || !answer) return json({ error: "Name and answer required" }, 400);

  const entries = await read(store);
  const key = name.toLowerCase();
  const existing = entries.findIndex((e) => e.name.toLowerCase() === key);
  const entry = { name, answer, at: new Date().toISOString() };
  if (existing > -1) entries[existing] = entry;
  else entries.push(entry);

  await store.setJSON(KEY, entries.slice(-MAX_ENTRIES));
  const counts = publicView(entries);
  await notify(entry, counts);
  return json(counts);
};

export const config = { path: "/.netlify/functions/roster" };
