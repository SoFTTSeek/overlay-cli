# softtseek

Command-line interface for the [SoFTTSeek](https://softtseek.com) peer-to-peer file-sharing network.

Search, browse, and download files from the overlay network directly from your terminal. Built for both interactive use and scripting/automation.

## Features

- **Distributed search** across sharded indexer nodes with filters for extension, file size, and result limit
- **Relay-based downloads** with NAT traversal, automatic retry/fallback across relay candidates, and progress reporting
- **Provider browsing** to list all files shared by a specific peer
- **Search result caching** so you can download by index number (`softtseek download 3`) without re-searching
- **TTY-aware output** with interactive progress bars in terminals, newline-delimited JSON when piped
- **All commands support `--json`** for machine-readable output, safe to pipe to `jq` or other tools
- **Structured exit codes** for reliable scripting (0 = success, 1 = empty, 2 = failure, 3 = config error)
- **Ed25519 identity** with deterministic anonymous display names, generated automatically on first run
- **Graceful signal handling** (Ctrl+C / SIGTERM) with proper connection cleanup
- **AbortSignal threading** through all network operations for cancellation support
- **Content-addressed transfers** with BLAKE3 hash verification on every download
- **Configurable infrastructure** with custom bootstrap/relay nodes via `~/.softtseek/config.json`
- **Zero configuration needed** to get started -- defaults to production network

## Install

```bash
npm install -g softtseek
```

Requires Node.js >= 18.

## Quick Start

```bash
# Initialize identity (first run only)
softtseek init

# Search for files
softtseek search "Artist - Song Title"

# Download result #3 from the last search
softtseek download 3

# Check network health
softtseek status

# See your identity
softtseek whoami
```

## Commands

### `softtseek init`

Initialize your identity and configuration directory (`~/.softtseek/`). Generates an Ed25519 keypair on first run. Subsequent runs display the existing identity.

```bash
softtseek init
```

**Output:** public key, fingerprint, anonymous display name, bootstrap/relay node URLs.

### `softtseek search <query>`

Search the overlay network for files matching a query. Results are cached locally so you can download by index number.

```bash
# Basic search
softtseek search "Artist - Song Title"

# Filter by extension and limit results
softtseek search "Artist Name" --ext mp3,flac --limit 10

# Filter by file size (in bytes)
softtseek search "Album Title" --min-size 1000000 --max-size 50000000

# Machine-readable output
softtseek search "Artist - Album" --json
```

| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Maximum results (default: 25) |
| `--ext <extensions>` | Filter by extension (comma-separated, e.g. `mp3,flac`) |
| `--min-size <bytes>` | Minimum file size in bytes |
| `--max-size <bytes>` | Maximum file size in bytes |
| `--json` | Output as newline-delimited JSON |

**Output columns:** index number, filename, size, extension, provider count, relevance score.

### `softtseek download <target> [providerPubKey]`

Download a file from the network. Supports two modes:

**By search index** (uses cached results from the last search):
```bash
softtseek download 3
softtseek download 1 --dest ~/Downloads
```

**By content hash** (explicit provider key):
```bash
softtseek download <contentHash> <providerPubKey>
softtseek download <contentHash> <providerPubKey> --dest ./output
```

| Option | Description |
|--------|-------------|
| `-d, --dest <dir>` | Destination directory (default: current directory) |

**Transfer features:**
- Real-time progress bar in TTY mode (percentage, MB downloaded/total)
- Newline-delimited JSON progress events when piped (non-TTY)
- Automatic BLAKE3 hash verification after download
- Cancellable with Ctrl+C (partial files are cleaned up)
- Automatic retry across relay candidates on failure

### `softtseek browse <pubkey>`

List all files shared by a specific provider.

```bash
softtseek browse <providerPubKey>
softtseek browse <providerPubKey> --json
```

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

**Output columns:** index number, file path, size, extension, content hash.

### `softtseek status`

Check the health of the overlay network infrastructure (bootstrap nodes, indexers, relays).

```bash
softtseek status
softtseek status --json
```

Exits with code 0 if all components are healthy, code 2 if any are down. Useful for monitoring scripts.

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

**Output columns:** component name, status (OK/DOWN), details.

### `softtseek whoami`

Display your current identity.

```bash
softtseek whoami
softtseek whoami --json
```

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

**Output fields:** public key, fingerprint, anonymous display name, config directory path.

## JSON Output & Scripting

All commands support `--json` for machine-readable output. Human-readable text (progress, prompts, errors) is written to stderr; structured data goes to stdout. This makes it safe to pipe:

```bash
# Get the content hash of the first search result
softtseek search "Artist - Song Title" --json | jq '.[0].contentHash'

# Get all providers for a result
softtseek search "query" --json | jq '.[0].providers'

# Monitor download progress programmatically
softtseek download 1 2>/dev/null | jq '.bytesDownloaded'

# Check if network is healthy in a script
if softtseek status --json | jq -e '.bootstrap' > /dev/null 2>&1; then
  echo "Network is up"
fi

# Get your public key for sharing
softtseek whoami --json | jq -r '.publicKey'

# Count files from a provider
softtseek browse <pubkey> --json | jq 'length'
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | No results / empty response |
| 2 | Operation failed (network error, download failure, unhealthy status) |
| 3 | Configuration or identity error |

## Configuration

Config is stored at `~/.softtseek/config.json` and created automatically on first run:

```json
{
  "bootstrapNodes": ["http://178.156.232.58:8080"],
  "relayNodes": ["relay://178.156.231.111:9000"],
  "defaultDownloadDir": "."
}
```

| Field | Description |
|-------|-------------|
| `bootstrapNodes` | URLs of bootstrap nodes for peer/indexer discovery |
| `relayNodes` | URLs of relay nodes for NAT traversal and file transfer |
| `defaultDownloadDir` | Default destination directory for downloads |

Identity keys are stored in `~/.softtseek/` with `0700` permissions (owner-only access).

## Search Result Cache

After running `softtseek search`, results are cached to `~/.softtseek/last-search.json`. This enables index-based downloads:

```bash
softtseek search "Artist - Album Title"    # Results: #1, #2, #3, ...
softtseek download 2                        # Downloads result #2
softtseek download 5 --dest ~/Downloads     # Downloads result #5
```

The cache persists until the next search. If you reference an invalid index, you'll get a clear error message prompting you to search again.

## Programmatic API

The CLI can also be used as a Node.js library:

```typescript
import { OverlayClient, getClient, shutdownClient } from 'softtseek';
import { loadConfig, saveConfig, getConfigDir } from 'softtseek';
import type { CliConfig } from 'softtseek';

// Managed singleton (same instance as the CLI uses)
const client = await getClient();
const results = await client.search('Artist - Song Title');
console.log(results[0].filename, results[0].size);
await shutdownClient();

// Or read/write config
const config = await loadConfig();
config.defaultDownloadDir = '~/Downloads';
await saveConfig(config);
```

For lower-level overlay network access (identity, hashing, relay transport, tokenization), see [`@softtseek/overlay-client`](https://www.npmjs.com/package/@softtseek/overlay-client).

## How It Works

SoFTTSeek is a decentralized P2P file-sharing network. The CLI connects to the overlay network via:

1. **Bootstrap nodes** -- discover available indexers and relays on the network
2. **Indexer nodes** -- distributed full-text search across a sharded index (4096 shards, BLAKE3-based routing)
3. **Relay nodes** -- NAT traversal for file transfer between peers who can't connect directly

**Key properties:**
- **Content-addressed**: Every file is identified by its BLAKE3 hash. Downloads are verified automatically.
- **Decentralized identity**: Ed25519 keypairs with BIP-39 mnemonic backup. No accounts or registration.
- **Anonymous by default**: Display names are deterministically generated from your public key fingerprint.
- **Relay retry/fallback**: If one relay fails, the client automatically tries other candidates.
- **End-to-end verified**: All transfers are hash-verified. All protocol messages are cryptographically signed.

## Related

- [`@softtseek/overlay-client`](https://www.npmjs.com/package/@softtseek/overlay-client) -- TypeScript client library (lower-level API)
- [SoFTTSeek Desktop App](https://softtseek.com) -- Full GUI application with Electron

## License

MIT
