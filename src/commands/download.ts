/**
 * softtseek download - Download a file from the overlay network
 *
 * Usage:
 *   softtseek download <contentHash> <providerPubKey> [--dest ./]
 *   softtseek download <index>  (from last search results)
 */

import { join, resolve } from 'path';
import type { Command } from 'commander';
import type { TransferProgress } from '@softtseek/overlay-client/lite';
import { getClient } from '../client.js';
import { cliSignal } from '../signal.js';
import { resolveDownloadTarget } from '../search-cache.js';
import { isTTY, formatSize } from '../output.js';

export function registerDownloadCommand(program: Command): void {
  program
    .command('download <target> [providerPubKey]')
    .description(
      'Download a file. Use an index from the last search, or provide <contentHash> <providerPubKey>.',
    )
    .option('-d, --dest <dir>', 'Destination directory', '.')
    .action(async (target: string, providerPubKey: string | undefined, opts: { dest: string }) => {
      try {
        let contentHash: string;
        let pubKey: string;
        let filename: string;

        // Detect if target is a numeric index from the last search
        const isIndex = /^\d+$/.test(target);

        if (isIndex) {
          const resolved = await resolveDownloadTarget(target);
          if (!resolved) {
            process.stderr.write(
              `Error: No cached search result at index ${target}. Run "softtseek search" first.\n`,
            );
            process.exit(1);
            return;
          }
          contentHash = resolved.contentHash;
          pubKey = resolved.providerPubKey;
          filename = resolved.filename;
        } else {
          // Direct content hash + provider pubkey
          if (!providerPubKey) {
            process.stderr.write(
              'Error: When downloading by content hash, you must provide <contentHash> <providerPubKey>.\n',
            );
            process.exit(1);
            return;
          }
          contentHash = target;
          pubKey = providerPubKey;
          filename = `${contentHash.slice(0, 16)}`;
        }

        const destPath = resolve(join(opts.dest, filename));

        if (isTTY()) {
          process.stderr.write(`Downloading: ${filename}\n`);
          process.stderr.write(`  Hash:     ${contentHash.slice(0, 16)}...\n`);
          process.stderr.write(`  Provider: ${pubKey.slice(0, 16)}...\n`);
          process.stderr.write(`  Dest:     ${destPath}\n`);
          process.stderr.write('\n');
        }

        const client = await getClient();

        const onProgress = (p: TransferProgress): void => {
          if (isTTY()) {
            const pct = p.totalBytes > 0 ? Math.floor((p.bytesDownloaded / p.totalBytes) * 100) : 0;
            const dlMB = (p.bytesDownloaded / 1024 / 1024).toFixed(1);
            const totalMB = (p.totalBytes / 1024 / 1024).toFixed(1);
            process.stderr.write(`\r  ${p.status} ${pct}% (${dlMB}/${totalMB} MB)`);
          } else {
            process.stdout.write(JSON.stringify(p) + '\n');
          }
        };

        const success = await client.download(contentHash, pubKey, destPath, {
          onProgress,
          signal: cliSignal,
        });

        if (isTTY()) {
          process.stderr.write('\n');
        }

        if (success) {
          if (isTTY()) {
            process.stderr.write(`Download complete: ${destPath}\n`);
          } else {
            process.stdout.write(JSON.stringify({ success: true, path: destPath }) + '\n');
          }
          process.exit(0);
        } else {
          process.stderr.write('Error: Download failed.\n');
          process.exit(2);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        process.stderr.write(`Error: Download failed - ${message}\n`);
        process.exit(2);
      }
    });
}
