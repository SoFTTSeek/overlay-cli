/**
 * softtseek init - Initialize identity and config directory
 */

import type { Command } from 'commander';
import { getConfigDir, loadConfig, saveConfig } from '../config.js';
import { getClient } from '../client.js';

export function registerInitCommand(program: Command): void {
  program
    .command('init')
    .description('Initialize identity and configuration directory')
    .action(async () => {
      try {
        const configDir = getConfigDir();

        // Ensure config exists with defaults
        const config = await loadConfig();
        await saveConfig(config);

        // Create client - this initializes identity on first run
        const client = await getClient();
        const identity = client.getIdentity();

        process.stdout.write(`Initialized SoFTTSeek identity\n`);
        process.stdout.write(`\n`);
        process.stdout.write(`  Config directory:  ${configDir}\n`);
        process.stdout.write(`  Public key:        ${identity.publicKey}\n`);
        process.stdout.write(`  Fingerprint:       ${identity.fingerprint}\n`);
        process.stdout.write(`  Display name:      ${identity.displayName}\n`);
        process.stdout.write(`\n`);
        process.stdout.write(`Bootstrap nodes:     ${config.bootstrapNodes.join(', ')}\n`);
        process.stdout.write(`Relay nodes:         ${config.relayNodes.join(', ')}\n`);

        process.exit(0);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: Failed to initialize - ${message}\n`);
        process.exit(3);
      }
    });
}
