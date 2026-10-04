// Team poll — "Who is your favorite sports leader?"
// GET  /.netlify/functions/vote?team=bolles  -> { counts, total, others }
// POST { team, choice, other }                -> records a vote, returns the same shape
// Each team keeps its own tally. No team given = bolles (the original page).
import { getStore } from "@netlify/blobs";

const CHOICES = ["Aaron Judge", "Lionel Messi", "Michael Jordan", "Derek Jeter", "Other"];
const BASE_KEY = "favorite-sports-leader";
const MAX_OTHERS = 300;

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

const empty = () => ({
  counts: Object.fromEntries(CHOICES.map((c) => [c, 0])),
  total: 0,
  others: [],
});

function normalize(raw) {
  const tally = empty();
  if (raw && typeof raw === "object") {
    for (const c of CHOICES) {
      const n = Number(raw.counts?.[c]);
      if (Number.isFinite(n) && n >= 0) tally.counts[c] = Math.floor(n);
    }
    if (Array.isArray(raw.others)) {
      tally.others = raw.others.filter((s) => typeof s === "string").slice(-MAX_OTHERS);
    }
  }
  tally.total = CHOICES.reduce((sum, c) => sum + tally.counts[c], 0);
  return tally;
}

export default async (req) => {
  const store = getStore({ name: "bolles-poll", consistency: "strong" });

  if (req.method === "GET") {
    const team = teamOf(new URL(req.url).searchParams.get("team"));
    const tally = normalize(await store.get(keyFor(team), { type: "json" }));
    return json(tally);
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const team = teamOf(body?.team || new URL(req.url).searchParams.get("team"));
  const choice = typeof body?.choice === "string" ? body.choice.trim() : "";
  if (!CHOICES.includes(choice)) {
    return json({ error: "Unknown choice" }, 400);
  }

  const key = keyFor(team);
  const tally = normalize(await store.get(key, { type: "json" }));
  tally.counts[choice] += 1;

  if (choice === "Other") {
    const other = typeof body?.other === "string" ? body.other.trim().slice(0, 60) : "";
    if (other) tally.others = [...tally.others, other].slice(-MAX_OTHERS);
  }

  tally.total = CHOICES.reduce((sum, c) => sum + tally.counts[c], 0);
  await store.setJSON(key, tally);
  return json(tally);
};

export const config = { path: "/.netlify/functions/vote" };
// Team poll — "Who is your favorite sports leader?"
// GET  /.netlify/functions/vote?team=bolles  -> { counts, total, others }
// POST { team, choice, other }                -> records a vote, returns the same shape
// Each team keeps its own tally. No team given = bolles (the original page).
import { getStore } from "@netlify/blobs";

const CHOICES = ["Aaron Judge", "Lionel Messi", "Michael Jordan", "Derek Jeter", "Other"];
const BASE_KEY = "favorite-sports-leader";
const MAX_OTHERS = 300;

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

const empty = () => ({
  counts: Object.fromEntries(CHOICES.map((c) => [c, 0])),
  total: 0,
  others: [],
});

function normalize(raw) {
  const tally = empty();
  if (raw && typeof raw === "object") {
    for (const c of CHOICES) {
      const n = Number(raw.counts?.[c]);
      if (Number.isFinite(n) && n >= 0) tally.counts[c] = Math.floor(n);
    }
    if (Array.isArray(raw.others)) {
      tally.others = raw.others.filter((s) => typeof s === "string").slice(-MAX_OTHERS);
    }
  }
  tally.total = CHOICES.reduce((sum, c) => sum + tally.counts[c], 0);
  return tally;
}

export default async (req) => {
  const store = getStore({ name: "bolles-poll", consistency: "strong" });

  if (req.method === "GET") {
    const team = teamOf(new URL(req.url).searchParams.get("team"));
    const tally = normalize(await store.get(keyFor(team), { type: "json" }));
    return json(tally);
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const team = teamOf(body?.team || new URL(req.url).searchParams.get("team"));
  const choice = typeof body?.choice === "string" ? body.choice.trim() : "";
  if (!CHOICES.includes(choice)) {
    return json({ error: "Unknown choice" }, 400);
  }

  const key = keyFor(team);
  const tally = normalize(await store.get(key, { type: "json" }));
  tally.counts[choice] += 1;

  if (choice === "Other") {
    const other = typeof body?.other === "string" ? body.other.trim().slice(0, 60) : "";
    if (other) tally.others = [...tally.others, other].slice(-MAX_OTHERS);
  }

  tally.total = CHOICES.reduce((sum, c) => sum + tally.counts[c], 0);
  await store.setJSON(key, tally);
  return json(tally);
};

export const config = { path: "/.netlify/functions/vote" };
// Bolles Leaders poll — tally storage for "Who is your favorite sports leader?"
// GET  /.netlify/functions/vote  -> { counts, total, others }
// POST /.netlify/functions/vote  { choice, other } -> records a vote, returns the same shape
import { getStore } from "@netlify/blobs";

const CHOICES = ["Aaron Judge", "Lionel Messi", "Michael Jordan", "Derek Jeter", "Other"];
const KEY = "favorite-sports-leader";
const MAX_OTHERS = 300;

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const empty = () => ({
  counts: Object.fromEntries(CHOICES.map((c) => [c, 0])),
  total: 0,
  others: [],
});

function normalize(raw) {
  const tally = empty();
  if (raw && typeof raw === "object") {
    for (const c of CHOICES) {
      const n = Number(raw.counts?.[c]);
      if (Number.isFinite(n) && n >= 0) tally.counts[c] = Math.floor(n);
    }
    if (Array.isArray(raw.others)) {
      tally.others = raw.others.filter((s) => typeof s === "string").slice(-MAX_OTHERS);
    }
  }
  tally.total = CHOICES.reduce((sum, c) => sum + tally.counts[c], 0);
  return tally;
}

export default async (req) => {
  const store = getStore({ name: "bolles-poll", consistency: "strong" });

  if (req.method === "GET") {
    const tally = normalize(await store.get(KEY, { type: "json" }));
    return json(tally);
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const choice = typeof body?.choice === "string" ? body.choice.trim() : "";
  if (!CHOICES.includes(choice)) {
    return json({ error: "Unknown choice" }, 400);
  }

  const tally = normalize(await store.get(KEY, { type: "json" }));
  tally.counts[choice] += 1;

  if (choice === "Other") {
    const other = typeof body?.other === "string" ? body.other.trim().slice(0, 60) : "";
    if (other) tally.others = [...tally.others, other].slice(-MAX_OTHERS);
  }

  tally.total = CHOICES.reduce((sum, c) => sum + tally.counts[c], 0);
  await store.setJSON(KEY, tally);
  return json(tally);
};

export const config = { path: "/.netlify/functions/vote" };
