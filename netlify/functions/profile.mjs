// Athlete profile — one list per team, private to the coach
// GET  /.netlify/functions/profile?team=trojans            -> { count }
// GET  ...&key=ROSTER_KEY                                  -> adds the full list
// POST { team, name, number, position, teamName, email, phone } -> saves it and emails Kenny
import { getStore } from "@netlify/blobs";

const BASE_KEY = "athlete-profiles";
const MAX_ENTRIES = 400;

const teamOf = (v) => {
  const t = String(v || "bolles").toLowerCase().trim();
  return /^[a-z0-9-]{1,20}$/.test(t) ? t : "bolles";
};
const keyFor = (team) => BASE_KEY + "-" + team;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const clean = (s, max) =>
  String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

async function read(store, key) {
  const raw = await store.get(key, { type: "json" });
  return Array.isArray(raw) ? raw.slice(-MAX_ENTRIES) : [];
}

// Netlify Forms submission so Kenny gets an email for every profile
async function notify(entry, team) {
  const site = process.env.URL;
  if (!site) return;
  const body = new URLSearchParams({
    "form-name": "athlete-profile",
    "Player name": entry.name,
    Team: entry.teamName || team,
    Number: entry.number || "-",
    Position: entry.position || "-",
    Email: entry.email || "-",
    Phone: entry.phone || "-",
  }).toString();
  try {
    await fetch(site + "/", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body,
    });
  } catch {
    // a failed email must never break the submission
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
      return json({ team, count: entries.length, entries });
    }
    return json({ count: entries.length });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const team = teamOf(body?.team || url.searchParams.get("team"));
  const name = clean(body?.name, 60);
  if (name.length < 2) return json({ error: "Name required" }, 400);

  const entry = {
    name,
    number: clean(body?.number, 4),
    position: clean(body?.position, 40),
    teamName: clean(body?.teamName, 60),
    email: clean(body?.email, 80),
    phone: clean(body?.phone, 24),
    at: new Date().toISOString(),
  };

  const storeKey = keyFor(team);
  const entries = await read(store, storeKey);
  const match = name.toLowerCase();
  const existing = entries.findIndex((e) => (e.name || "").toLowerCase() === match);
  if (existing > -1) entries[existing] = entry;
  else entries.push(entry);

  await store.setJSON(storeKey, entries.slice(-MAX_ENTRIES));
  await notify(entry, team);
  return json({ count: entries.length });
};

export const config = { path: "/.netlify/functions/profile" };
