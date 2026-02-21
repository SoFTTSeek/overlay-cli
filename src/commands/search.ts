/**
 * softtseek search <query> - Search the overlay network
 */

import type { Command } from 'commander';
import { getClient } from '../client.js';
import { cliSignal } from '../signal.js';
import { formatSize, formatDuration, printOutput, printNDJSON } from '../output.js';
import { saveSearchResults } from '../search-cache.js';

export function registerSearchCommand(program: Command): void {
  program
    .command('search <query>')
    .description('Search the overlay network for files')
    .option('-l, --limit <n>', 'Maximum results to return', '25')
    .option('--ext <extensions>', 'Filter by file extension (comma-separated, e.g. mp3,flac)')
    .option('--min-size <bytes>', 'Minimum file size in bytes')
    .option('--max-size <bytes>', 'Maximum file size in bytes')
    .option('--json', 'Output as JSON')
    .action(async (query: string, opts: {
      limit: string;
      ext?: string;
      minSize?: string;
      maxSize?: string;
      json?: boolean;
    }) => {
      try {
        const client = await getClient();

        const limit = parseInt(opts.limit, 10) || 25;
        const filters: Record<string, unknown> = {};

        if (opts.ext) {
          filters.ext = opts.ext.split(',').map(e => e.trim().toLowerCase());
        }
        if (opts.minSize) {
          filters.minSize = parseInt(opts.minSize, 10);
        }
        if (opts.maxSize) {
          filters.maxSize = parseInt(opts.maxSize, 10);
        }

        const hasFilters = Object.keys(filters).length > 0;
        const results = await client.search(query, {
          filters: hasFilters ? filters as any : undefined,
          limit,
          signal: cliSignal,
        });

        if (results.length === 0) {
          process.stderr.write('No results found.\n');
          process.exit(1);
        }

        // Cache results for index-based download
        await saveSearchResults(results);

        // Check online status of providers across all relays
        const onlineProviders = await client.getOnlineProviders();
        const hasOnlineStatus = onlineProviders !== null;

        // Format output
        const headers = hasOnlineStatus
          ? ['#', 'Filename', 'Size', 'Ext', 'Providers', 'Online', 'Score']
          : ['#', 'Filename', 'Size', 'Ext', 'Providers', 'Score'];

        const rows = results.map((r, i) => {
          const base = [
            String(i + 1),
            r.filename.length > 50 ? r.filename.slice(0, 47) + '...' : r.filename,
            formatSize(r.size),
            r.ext,
            String(r.providers.length),
          ];
          if (hasOnlineStatus) {
            const anyOnline = r.providers.some(p => p.pubKey && onlineProviders.has(p.pubKey));
            base.push(anyOnline ? 'Y' : 'N');
          }
          base.push(r.score.toFixed(1));
          return base;
        });

        if (opts.json) {
          const enriched = results.map(r => ({
            ...r,
            online: hasOnlineStatus
              ? r.providers.some(p => p.pubKey && onlineProviders.has(p.pubKey))
              : null,
          }));
          printNDJSON(enriched);
        } else {
          printOutput(results, headers, rows, false);
          process.stderr.write(`\n${results.length} result(s). Use "softtseek download <#>" to download.\n`);
        }

        process.exit(0);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: Search failed - ${message}\n`);
        process.exit(2);
      }
    });
}
