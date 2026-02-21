# softtseek

Command-line interface for the [SoFTTSeek](https://softtseek.com) peer-to-peer file-sharing network.

Search, browse, and download files from the overlay network directly from your terminal. Designed for both interactive use and scripting/automation (all commands support `--json` output).

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
softtseek search "dark side of the moon"

# Download result #3 from the last search
softtseek download 3

# Check network health
softtseek status
```

## Commands

### `softtseek init`

Initialize your identity and configuration directory (`~/.softtseek/`). Generates an Ed25519 keypair on first run. Subsequent runs display the existing identity.

```bash
softtseek init
```

**Output:** public key, fingerprint, anonymous display name, bootstrap/relay node URLs.

### `softtseek search <query>`

Search the overlay network for files matching a query.

```bash
softtseek search "lateralus flac"
softtseek search "radiohead" --ext mp3,flac --limit 10
softtseek search "bach cello" --min-size 1000000 --json
```

| Option | Description |
|--------|-------------|
| `-l, --limit <n>` | Maximum results (default: 25) |
| `--ext <extensions>` | Filter by extension (comma-separated, e.g. `mp3,flac`) |
| `--min-size <bytes>` | Minimum file size in bytes |
| `--max-size <bytes>` | Maximum file size in bytes |
| `--json` | Output as newline-delimited JSON |

Results are cached locally so you can download by index number (see below).

### `softtseek download <target> [providerPubKey]`

Download a file from the network. Two modes:

**By search index** (uses cached results from last search):
```bash
softtseek download 3
softtseek download 1 --dest ~/Music
```

**By content hash** (explicit provider):
```bash
softtseek download abc123...def providerPubKey...xyz --dest ./downloads
```

| Option | Description |
|--------|-------------|
| `-d, --dest <dir>` | Destination directory (default: current directory) |

Progress is shown interactively in TTY mode. In non-TTY mode (piped), progress events are emitted as newline-delimited JSON on stdout.

### `softtseek browse <pubkey>`

List all files shared by a specific provider.

```bash
softtseek browse abc123...def
softtseek browse abc123...def --json
```

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

### `softtseek status`

Check the health of the overlay network infrastructure (bootstrap, indexers, relays).

```bash
softtseek status
softtseek status --json
```

Exits with code 0 if all components are healthy, code 2 if any are down.

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

### `softtseek whoami`

Display your current identity.

```bash
softtseek whoami
softtseek whoami --json
```

**Output:** public key, fingerprint, anonymous display name, config directory path.

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON |

## JSON Output

All commands support `--json` for machine-readable output. Human-readable text is written to stderr; structured data goes to stdout. This makes it safe to pipe:

```bash
# Parse search results with jq
softtseek search "query" --json | jq '.[0].contentHash'

# Monitor download progress programmatically
softtseek download 1 2>/dev/null | jq '.bytesDownloaded'

# Check if network is healthy in a script
if softtseek status --json | jq -e '.bootstrap' > /dev/null; then
  echo "Network is up"
fi
```

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | No results / empty response |
| 2 | Operation failed (network error, download failure, unhealthy status) |
| 3 | Configuration or identity error |

## Configuration

Config is stored at `~/.softtseek/config.json`:

```json
{
  "bootstrapNodes": ["http://178.156.232.58:8080"],
  "relayNodes": ["relay://178.156.231.111:9000"],
  "defaultDownloadDir": "."
}
```

Identity keys are stored in `~/.softtseek/` with `0700` permissions.

## Programmatic API

The CLI can also be used as a library:

```typescript
import { OverlayClient, getClient, shutdownClient } from 'softtseek';
import { loadConfig, getConfigDir } from 'softtseek';

const client = await getClient();
const results = await client.search('query');
await shutdownClient();
```

For lower-level overlay network access, see [`@softtseek/overlay-client`](https://www.npmjs.com/package/@softtseek/overlay-client).

## How It Works

SoFTTSeek is a decentralized P2P file-sharing network. The CLI connects to the overlay network via:

1. **Bootstrap** nodes for peer/indexer discovery
2. **Indexer** nodes for distributed full-text search
3. **Relay** nodes for NAT traversal and file transfer

All transfers are content-addressed (BLAKE3 hashes) and verified end-to-end. Identity is based on Ed25519 keypairs with deterministic anonymous display names.

## License

MIT
