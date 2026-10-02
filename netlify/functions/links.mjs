// Bolles Leaders — reading list of articles
// GET  /.netlify/functions/links            -> { links: [{id,url,title,note,at}] }
// POST /.netlify/functions/links            -> { key, url, title, note }  adds a link  (key required)
// POST /.netlify/functions/links            -> { key, remove: id }        removes one  (key required)
import { getStore } from "@netlify/blobs";

const KEY = "reading-links";
const MAX_LINKS = 60;

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

async function read(store) {
  const raw = await store.get(KEY, { type: "json" });
  return Array.isArray(raw) ? raw.slice(-MAX_LINKS) : [];
}

export default async (req) => {
  const store = getStore({ name: "bolles-poll", consistency: "strong" });

  if (req.method === "GET") {
    const links = await read(store);
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

  let links = await read(store);

  if (body.remove) {
    links = links.filter((l) => l.id !== body.remove);
    await store.setJSON(KEY, links);
    return json({ links: links.slice().reverse() });
  }

  const url = clean(body.url, 500);
  if (!/^https?:\/\//i.test(url)) return json({ error: "Need a full http(s) link" }, 400);

  const entry = {
    id: Math.random().toString(36).slice(2, 10),
    url,
    title: clean(body.title, 120) || titleFrom(url),
    note: clean(body.note, 200),
    at: new Date().toISOString(),
  };

  links = links.filter((l) => l.url !== url).concat(entry).slice(-MAX_LINKS);
  await store.setJSON(KEY, links);
  return json({ links: links.slice().reverse() });
};

export const config = { path: "/.netlify/functions/links" };
