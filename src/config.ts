/**
 * CLI Configuration - Load/save config from ~/.softtseek/config.json
 */

import { homedir } from 'os';
import { join } from 'path';
import { readFile, writeFile, mkdir } from 'fs/promises';

/** CLI configuration shape */
export interface CliConfig {
  bootstrapNodes: string[];
  relayNodes: string[];
  defaultDownloadDir: string;
  /** Display name for this identity */
  displayName?: string;
}

const DEFAULT_CONFIG: CliConfig = {
  bootstrapNodes: ['http://178.156.232.58:8080'],
  relayNodes: ['relay://178.156.231.111:9000'],
  defaultDownloadDir: '.',
};

/**
 * Get the configuration directory path (~/.softtseek)
 */
export function getConfigDir(): string {
  return join(homedir(), '.softtseek');
}

/**
 * Load config from disk, merging with defaults for any missing fields.
 * Returns defaults if the config file does not exist.
 */
export async function loadConfig(): Promise<CliConfig> {
  const configPath = join(getConfigDir(), 'config.json');

  try {
    const raw = await readFile(configPath, 'utf-8');
    const parsed = JSON.parse(raw) as Partial<CliConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    // File missing or unparseable - return defaults
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save config to disk. Creates the config directory if it does not exist.
 */
export async function saveConfig(config: CliConfig): Promise<void> {
  const dir = getConfigDir();
  await mkdir(dir, { recursive: true, mode: 0o700 });

  const configPath = join(dir, 'config.json');
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
}
