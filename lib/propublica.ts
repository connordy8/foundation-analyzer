import { ProPublicaSearchResult, ProPublicaOrgResponse } from "./types";

const BASE_URL = "https://projects.propublica.org/nonprofits";
const API_URL = `${BASE_URL}/api/v2`;

// Simple in-memory cache with TTL
const cache = new Map<string, { data: unknown; expires: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setCache(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expires: Date.now() + ttlMs });
}

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_HOUR = 60 * 60 * 1000;

export async function searchOrganizations(
  query: string,
  page: number = 0
): Promise<ProPublicaSearchResult> {
  const cacheKey = `search:${query}:${page}`;
  const cached = getCached<ProPublicaSearchResult>(cacheKey);
  if (cached) return cached;

  const url = `${API_URL}/search.json?q=${encodeURIComponent(query)}&page=${page}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ProPublica search failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  setCache(cacheKey, data, FIVE_MINUTES);
  return data;
}

export async function getOrganization(ein: string): Promise<ProPublicaOrgResponse> {
  const cleanEin = ein.replace(/-/g, "");
  const cacheKey = `org:${cleanEin}`;
  const cached = getCached<ProPublicaOrgResponse>(cacheKey);
  if (cached) return cached;

  const url = `${API_URL}/organizations/${cleanEin}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`ProPublica org lookup failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  setCache(cacheKey, data, ONE_HOUR);
  return data;
}

export async function getXmlObjectIds(ein: string): Promise<string[]> {
  const cleanEin = ein.replace(/-/g, "");
  const cacheKey = `xmlids:${cleanEin}`;
  const cached = getCached<string[]>(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/organizations/${cleanEin}`;
  const res = await fetch(url);
  if (!res.ok) {
    return [];
  }
  const html = await res.text();

  // Extract object_id values from download-xml links
  const regex = /download-xml\?object_id=(\d+)/g;
  const ids: string[] = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    if (!ids.includes(match[1])) {
      ids.push(match[1]);
    }
  }

  setCache(cacheKey, ids, ONE_HOUR);
  return ids;
}

export async function fetchXmlContent(objectId: string): Promise<string> {
  const cacheKey = `xml:${objectId}`;
  const cached = getCached<string>(cacheKey);
  if (cached) return cached;

  const url = `${BASE_URL}/download-xml?object_id=${objectId}`;
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) {
    throw new Error(`XML fetch failed: ${res.status} ${res.statusText}`);
  }
  const xml = await res.text();

  // Cache XML for 24 hours (it never changes)
  setCache(cacheKey, xml, 24 * 60 * 60 * 1000);
  return xml;
}
