#!/usr/bin/env node

/**
 * softtseek - CLI for the SoFTTSeek P2P file-sharing network
 */

import { Command } from 'commander';
import { shutdownClient } from './client.js';
import { abortCli } from './signal.js';
import { registerInitCommand } from './commands/init.js';
import { registerSearchCommand } from './commands/search.js';
import { registerDownloadCommand } from './commands/download.js';
import { registerStatusCommand } from './commands/status.js';
import { registerWhoamiCommand } from './commands/whoami.js';
import { registerBrowseCommand } from './commands/browse.js';

const program = new Command();

program
  .name('softtseek')
  .description('CLI for the SoFTTSeek P2P file-sharing network')
  .version('0.1.2');

// Register commands
registerInitCommand(program);
registerSearchCommand(program);
registerDownloadCommand(program);
registerStatusCommand(program);
registerWhoamiCommand(program);
registerBrowseCommand(program);

// Clean shutdown on signals
async function handleShutdown(): Promise<void> {
  abortCli();
  await shutdownClient();
  process.exit(0);
}

process.on('SIGINT', () => {
  handleShutdown().catch(() => process.exit(1));
});

process.on('SIGTERM', () => {
  handleShutdown().catch(() => process.exit(1));
});

// Parse and run
program.parseAsync(process.argv).catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`Fatal: ${message}\n`);
  process.exit(1);
});
