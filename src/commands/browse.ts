/**
 * softtseek browse <pubkey> - Browse a provider's shared files
 */

import type { Command } from 'commander';
import { getClient } from '../client.js';
import { formatSize, formatDuration, printOutput } from '../output.js';

export function registerBrowseCommand(program: Command): void {
  program
    .command('browse <pubkey>')
    .description("List a provider's shared files")
    .option('--json', 'Output as JSON')
    .action(async (pubkey: string, opts: { json?: boolean }) => {
      try {
        const client = await getClient();
        const files = await client.browseProvider(pubkey);

        if (files.length === 0) {
          process.stderr.write('No files shared by this provider.\n');
          process.exit(1);
          return;
        }

        const headers = ['#', 'Path', 'Size', 'Ext', 'Hash'];
        const rows = files.map((f, i) => [
          String(i + 1),
          f.path.length > 50 ? f.path.slice(0, 47) + '...' : f.path,
          formatSize(f.size),
          f.ext,
          f.contentHash.slice(0, 12) + '...',
        ]);

        printOutput(files, headers, rows, opts.json === true);

        if (!opts.json) {
          process.stderr.write(`\n${files.length} file(s) from provider ${pubkey.slice(0, 16)}...\n`);
        }

        process.exit(0);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: Browse failed - ${message}\n`);
        process.exit(2);
      }
    });
}
