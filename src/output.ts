/**
 * Output formatting - TTY-aware table/JSON output
 */

/**
 * Check if stdout is a TTY (interactive terminal).
 */
export function isTTY(): boolean {
  return process.stdout.isTTY === true;
}

/**
 * Format a table for TTY output.
 * Pads each column to the maximum width of the header or data in that column.
 */
export function formatTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) => {
    const dataMax = rows.reduce((max, row) => Math.max(max, (row[i] ?? '').length), 0);
    return Math.max(h.length, dataMax);
  });

  const sep = colWidths.map(w => '-'.repeat(w)).join('  ');
  const headerLine = headers.map((h, i) => h.padEnd(colWidths[i]!)).join('  ');
  const dataLines = rows.map(row =>
    row.map((cell, i) => (cell ?? '').padEnd(colWidths[i]!)).join('  ')
  );

  return [headerLine, sep, ...dataLines].join('\n');
}

/**
 * Format bytes into a human-readable string (e.g. 1.5 MB).
 */
export function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = bytes / Math.pow(k, i);

  return `${value >= 100 ? value.toFixed(0) : value >= 10 ? value.toFixed(1) : value.toFixed(2)} ${units[i]}`;
}

/**
 * Format seconds into a human-readable duration (e.g. 3m 42s).
 */
export function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '-';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.round(seconds % 60);

  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

/**
 * Print NDJSON (one JSON object per line) to stdout.
 * Used for array results (e.g. search) so downstream tools can process line-by-line.
 */
export function printNDJSON(items: unknown[]): void {
  for (const item of items) {
    process.stdout.write(JSON.stringify(item) + '\n');
  }
}

/**
 * Print output as JSON or a table depending on the --json flag or TTY status.
 *
 * @param data - The structured data to output (will be JSON.stringify'd for JSON mode)
 * @param headers - Column headers for table mode
 * @param rows - Row data for table mode
 * @param jsonFlag - Whether the user explicitly passed --json
 */
export function printOutput(
  data: unknown,
  headers: string[],
  rows: string[][],
  jsonFlag: boolean,
): void {
  if (jsonFlag || !isTTY()) {
    process.stdout.write(JSON.stringify(data, null, 2) + '\n');
  } else {
    process.stdout.write(formatTable(headers, rows) + '\n');
  }
}
