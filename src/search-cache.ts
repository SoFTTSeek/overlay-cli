/**
 * Search Cache - persist last search results for index-based downloads
 */

import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { getConfigDir } from './config.js';
import type { SearchResult } from '@softtseek/overlay-client/lite';

const CACHE_FILE = join(getConfigDir(), '.last-search.json');

/** What we need to resolve a download from a search index */
export interface DownloadTarget {
  contentHash: string;
  providerPubKey: string;
  filename: string;
}

/**
 * Save search results to the cache file.
 * Results are stored with 1-based indices for user-friendly references.
 */
export async function saveSearchResults(results: SearchResult[]): Promise<void> {
  const entries = results.map((r, i) => ({
    index: i + 1,
    contentHash: r.contentHash ?? r.id,
    filename: r.filename,
    size: r.size,
    providers: r.providers,
  }));

  await writeFile(CACHE_FILE, JSON.stringify(entries, null, 2) + '\n', 'utf-8');
}

/**
 * Load the last cached search results.
 * Returns an empty array if the cache is missing or corrupt.
 */
export async function loadSearchResults(): Promise<
  Array<{
    index: number;
    contentHash: string;
    filename: string;
    size: number;
    providers: Array<{ pubKey?: string; username?: string }>;
  }>
> {
  try {
    const raw = await readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/**
 * Resolve a 1-based index string (e.g. "3") to a download target
 * using the cached search results.
 *
 * Returns null if the index is out of range or the cache is empty/missing.
 */
export async function resolveDownloadTarget(
  indexStr: string,
): Promise<DownloadTarget | null> {
  const index = parseInt(indexStr, 10);
  if (isNaN(index) || index < 1) return null;

  const cached = await loadSearchResults();
  const entry = cached.find(e => e.index === index);
  if (!entry) return null;

  // Pick the first provider that has a public key
  const provider = entry.providers.find(p => p.pubKey);
  if (!provider?.pubKey) return null;

  return {
    contentHash: entry.contentHash,
    providerPubKey: provider.pubKey,
    filename: entry.filename,
  };
}
