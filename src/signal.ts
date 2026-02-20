/**
 * Shared AbortController for CLI — fires on SIGINT so in-flight requests cancel cleanly.
 * Extracted to its own module to avoid circular imports between cli.ts and command modules.
 */

const abortController = new AbortController();

export const cliSignal: AbortSignal = abortController.signal;

export function abortCli(): void {
  abortController.abort();
}
