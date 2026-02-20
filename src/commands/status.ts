/**
 * softtseek status - Check overlay network health
 */

import type { Command } from 'commander';
import { getClient } from '../client.js';
import { printOutput } from '../output.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Check overlay network health')
    .option('--json', 'Output as JSON')
    .action(async (opts: { json?: boolean }) => {
      try {
        const client = await getClient();
        const health = await client.checkHealth();

        const headers = ['Component', 'Status', 'Details'];
        const rows: string[][] = [
          ['Bootstrap', health.bootstrap ? 'OK' : 'DOWN', health.bootstrap ? 'reachable' : 'unreachable'],
          [
            'Indexers',
            health.indexers.length > 0 ? 'OK' : 'DOWN',
            health.indexers.length > 0
              ? `${health.indexers.length} online (${health.indexers.join(', ')})`
              : 'none reachable',
          ],
          [
            'Relays',
            health.relays.length > 0 ? 'OK' : 'DOWN',
            health.relays.length > 0
              ? `${health.relays.length} online (${health.relays.join(', ')})`
              : 'none reachable',
          ],
        ];

        printOutput(health, headers, rows, opts.json === true);

        // Exit with error code if any component is down
        const allHealthy = health.bootstrap && health.indexers.length > 0 && health.relays.length > 0;
        process.exit(allHealthy ? 0 : 2);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: Health check failed - ${message}\n`);
        process.exit(2);
      }
    });
}
