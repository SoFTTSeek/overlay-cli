/**
 * softtseek whoami - Display current identity
 */

import type { Command } from 'commander';
import { getClient } from '../client.js';
import { printOutput } from '../output.js';
import { getConfigDir } from '../config.js';

export function registerWhoamiCommand(program: Command): void {
  program
    .command('whoami')
    .description('Show current identity (public key, fingerprint, display name)')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const client = await getClient();
        const identity = client.getIdentity();

        const data = {
          publicKey: identity.publicKey,
          fingerprint: identity.fingerprint,
          displayName: identity.displayName,
          configDir: getConfigDir(),
        };

        const headers = ['Field', 'Value'];
        const rows: string[][] = [
          ['Public Key', identity.publicKey],
          ['Fingerprint', identity.fingerprint],
          ['Display Name', identity.displayName],
          ['Config Dir', getConfigDir()],
        ];

        printOutput(data, headers, rows, opts.json === true);
        process.exit(0);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: Failed to read identity - ${message}\n`);
        process.exit(3);
      }
    });
}
