/**
 * softtseek - Programmatic API
 *
 * Re-exports the OverlayClient for use as a library.
 */

export { OverlayClient, getClient, shutdownClient } from './client.js';
export { loadConfig, saveConfig, getConfigDir } from './config.js';
export type { CliConfig } from './config.js';
