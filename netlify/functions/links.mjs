// Reading list of articles — one list per team
// GET  /.netlify/functions/links?team=bolles  -> { links: [{id,url,title,note,at}] }
// POST { team, key, url, title, note }        -> adds a link   (key required)
// POST { team, key, remove: id }              -> removes one   (key required)
import { getStore } from "@netlify/blobs";

const BASE_KEY = "reading-links";
const MAX_LINKS = 60;

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

const clean = (s, max) =>
  String(s || "").replace(/[<>]/g, "").replace(/\s+/g, " ").trim().slice(0, max);

function titleFrom(url) {
  try {
    const u = new URL(url);
    const last = u.pathname.split("/").filter(Boolean).pop() || u.hostname;
    return last.replace(/[-_]+/g, " ").replace(/\.\w+$/, "").trim() || u.hostname;
  } catch {
    return url;
  }
}

async function read(store, key) {
  const raw = await store.get(key, { type: "json" });
  return Array.isArray(raw) ? raw.slice(-MAX_LINKS) : [];
}

export default async (req) => {
  const store = getStore({ name: "bolles-poll", consistency: "strong" });
  const url0 = new URL(req.url);

  if (req.method === "GET") {
    const team = teamOf(url0.searchParams.get("team"));
    const links = await read(store, keyFor(team));
    return json({ links: links.slice().reverse() });
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Bad request" }, 400);
  }

  const secret = process.env.ROSTER_KEY;
  if (!secret || body?.key !== secret) return json({ error: "Not authorized" }, 401);

  const team = teamOf(body?.team || url0.searchParams.get("team"));
  const storeKey = keyFor(team);
  let links = await read(store, storeKey);

  if (body.remove) {
    links = links.filter((l) => l.id !== body.remove);
    await store.setJSON(storeKey, links);
    return json({ links: links.slice().reverse() });
  }

  const link = clean(body.url, 500);
  if (!/^https?:\/\//i.test(link)) return json({ error: "Need a full http(s) link" }, 400);

  const entry = {
    id: Math.random().toString(36).slice(2, 10),
    url: link,
    title: clean(body.title, 120) || titleFrom(link),
    note: clean(body.note, 200),
    at: new Date().toISOString(),
  };

  links = links.filter((l) => l.url !== link).concat(entry).slice(-MAX_LINKS);
  await store.setJSON(storeKey, links);
  return json({ links: links.slice().reverse() });
};

export const config = { path: "/.netlify/functions/links" };
