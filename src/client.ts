/**
 * Lazy OverlayClient initializer - shared across commands.
 * Uses the /lite entry point (pure-JS, no native deps required).
 */

import { OverlayClient } from '@softtseek/overlay-client/lite';
import { loadConfig, getConfigDir } from './config.js';

// Re-export OverlayClient for convenience
export { OverlayClient };

// Re-export types commands need
export type { SearchResult, QueryFilters, OverlayBrowseFile } from '@softtseek/overlay-client/lite';

// ---- Lazy singleton ----

let clientInstance: OverlayClient | null = null;

/**
 * Get or create the shared OverlayClient instance.
 * All commands should call this instead of constructing their own client.
 */
export async function getClient(): Promise<OverlayClient> {
  if (!clientInstance) {
    const config = await loadConfig();
    clientInstance = await OverlayClient.create({
      configDir: getConfigDir(),
      bootstrapNodes: config.bootstrapNodes,
      relayNodes: config.relayNodes,
    });
  }
  return clientInstance;
}

/**
 * Shut down the shared client instance (called on SIGINT/SIGTERM).
 */
export async function shutdownClient(): Promise<void> {
  if (clientInstance) {
    await clientInstance.shutdown();
    clientInstance = null;
  }
}
