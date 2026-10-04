// "Are you in?" roster — one list per team
// GET  /.netlify/functions/roster?team=bolles        -> { inCount, outCount, total }
// GET  ...&key=ROSTER_KEY                            -> adds entries (names) for the coach
// POST { team, name, answer }                        -> records the answer and emails Kenny
import { getStore } from "@netlify/blobs";

const BASE_KEY = "are-you-in";
const MAX_ENTRIES = 400;
const MAX_NAME = 40;

const teamOf = (v) => {
  const t = String(v || "bolles").toLowerCase().trim();
  return /^[a-z0-9-]{1,20}$/.test(t) ? t : "bolles";
};
const keyFor = (team) => (team === "bolles" ? BASE_KEY : BASE_KEY + "-" + team);

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

async function read(store, key) {
  const raw = await store.get(key, { type: "json" });
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((e) => e && typeof e.name === "string" && (e.answer === "yes" || e.answer === "no"))
    .slice(-MAX_ENTRIES);
}

// Fire a Netlify Forms submission so Kenny gets an email for every answer.
async function notify(entry, counts, team) {
  const site = process.env.URL;
  if (!site) return;
  const body = new URLSearchParams({
    "form-name": "roster-signup",
    "Player name": entry.name,
    Answer: entry.answer === "yes" ? "IN" : "Not this time",
    When: entry.at,
    "Running total in": team + ": " + counts.inCount,
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
  const url = new URL(req.url);

  if (req.method === "GET") {
    const team = teamOf(url.searchParams.get("team"));
    const entries = await read(store, keyFor(team));
    const key = url.searchParams.get("key");
    const secret = process.env.ROSTER_KEY;
    if (key && secret && key === secret) {
      return json({
        team,
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

  const team = teamOf(body?.team || url.searchParams.get("team"));
  const name = clean(body?.name);
  const answer = body?.answer === "yes" ? "yes" : body?.answer === "no" ? "no" : null;
  if (name.length < 2 || !answer) return json({ error: "Name and answer required" }, 400);

  const storeKey = keyFor(team);
  const entries = await read(store, storeKey);
  const match = name.toLowerCase();
  const existing = entries.findIndex((e) => e.name.toLowerCase() === match);
  const entry = { name, answer, at: new Date().toISOString() };
  if (existing > -1) entries[existing] = entry;
  else entries.push(entry);

  await store.setJSON(storeKey, entries.slice(-MAX_ENTRIES));
  const counts = publicView(entries);
  await notify(entry, counts, team);
  return json(counts);
};

export const config = { path: "/.netlify/functions/roster" };
