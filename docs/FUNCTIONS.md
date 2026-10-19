# Function Reference

All paths are under `src/`. The calculation engine (`features/calculator`) has no React dependency. Addresses are handled as unsigned 32-bit integers (`>>> 0`). Invalid input throws `InputError` (`message`, `field`).

## features/calculator/ipv4.ts

| Function | Description |
|---|---|
| `parseIpv4(text, field?)` | Strict dotted-decimal → unsigned 32-bit int. Rejects blanks, wrong octet count, non-digits, leading zeros, values > 255. Trims whitespace. |
| `formatIpv4(value)` | Unsigned int → `a.b.c.d`. |
| `toBinaryOctets(value)` | Int → 32 bits grouped as `xxxxxxxx.xxxxxxxx.xxxxxxxx.xxxxxxxx`. |
| `isValidIpv4(text)` | Boolean wrapper around `parseIpv4`. |

## features/calculator/subnet-mask.ts

| Function | Description |
|---|---|
| `parsePrefix(text \| number, field?)` | Accepts `24` or `/24`; must be a whole number 0–32. |
| `prefixToMask(prefix)` | Prefix → 32-bit mask int; `/0` returns 0 explicitly. |
| `prefixToMaskString(prefix)` | Prefix → dotted mask. |
| `maskToPrefix(maskText, field?)` | Dotted mask → prefix; throws if the 1-bits are not contiguous. |

## features/calculator/subnet.ts

| Function | Description |
|---|---|
| `blockSize(prefix)` | `2^(32 - prefix)`. |
| `broadcastOf(network, prefix)` | Last address of a block. |
| `hostInfo(network, prefix)` | Usable count, first/last host and an explanatory note. `/31` → 2 usable (RFC 3021), `/32` → 1, otherwise total − 2. |
| `calculateSubnet(address, prefix)` | Main calculation. Returns `SubnetResult`: CIDR, masks, network, broadcast, totals, usable hosts, first/last host, note, class, scope, binary strings. |
| `parseCidr(text, field?)` | Parses `a.b.c.d/nn` or `a.b.c.d/255.255.x.x` into `{ address, prefix }`. |
| `parseBlock(text, field?)` | CIDR text → `{ network, prefix }` with host bits cleared. |
| `makeChild(network, prefix, index)` | Builds a `ChildSubnet` record for one block. |
| `splitSubnet(parent, childPrefix, offset?, limit?)` | Equal-size split. Returns one page of subnets plus the true `totalChildren`. Throws if the child prefix is shorter than the parent's. |
| `checkOverlap(a, b)` | Returns `identical`, `a-contains-b`, `b-contains-a` or `disjoint`, with intersection and explanation. |

Internal (not exported): `classify(ip)` determines address class and scope (RFC 1918, loopback, link-local, CGNAT, multicast, reserved).

## features/calculator/vlsm.ts

| Function | Description |
|---|---|
| `prefixForHosts(hosts, opts?)` | Smallest prefix whose usable hosts (total − 2) cover `hosts`. With `useSlash31ForTwoHosts`, 2 hosts → `/31`. |
| `validateRequirements(reqs)` | Requires at least one entry, non-empty unique names (case-insensitive), whole host counts ≥ 1. |
| `allocateVlsm(parent, reqs, opts?)` | Sorts largest first (stable), allocates aligned blocks inside the parent, records requirements that do not fit in `failures`, and computes `unused` CIDR blocks and usage totals. |

Internal: `rangeToBlocks(start, end)` splits an address range into the fewest aligned CIDR blocks.

## features/history/history-storage.ts

| Function | Description |
|---|---|
| `loadHistory()` | Reads and validates saved items (max 20); returns `[]` on missing, corrupt or blocked storage. |
| `saveHistory(items)` | Writes to localStorage; returns `false` if it fails. |
| `addHistory(items, cidr)` | Returns a new list with the entry first, duplicates removed, capped at 20. |

## features/export/export-results.ts

| Function | Description |
|---|---|
| `summaryText(result)` | Plain-text report for copying. |
| `csvEscape(value)` | Quotes values containing commas, quotes or newlines; doubles quotes. |
| `toCsv(result, timestamp?)` | Header row + data row (CRLF). |
| `toJson(result, timestamp?)` | Pretty JSON of the same fields. |
| `exportFilename(result, ext)` | e.g. `subnet-192-168-10-0-24.csv`. |
| `downloadText(filename, text, mime)` | Triggers a browser download via a Blob. |

## lib/

| Function | Description |
|---|---|
| `copyText(text)` (`clipboard.ts`) | Clipboard API with legacy fallback; resolves `false` on failure. |
| `errorMessage(e)` (`validation.ts`) | User-safe message from an error. |
| `splitCombined(text)` (`validation.ts`) | Splits `ip/prefix` into form field strings, or `null` if invalid. |
| `fmtNum(n)` (`format.ts`) | Thousands-separated number. |

## Components (`components/`, `app/`)

| Component | Role |
|---|---|
| `App` | State, tabs, theme, history, share-link loading, toast notices. |
| `AddressInput` | Address/prefix form, presets, inline errors, combined paste. |
| `SubnetResult` | Hero, stats, details, binary view and export sections. |
| `ResultTable` | Detail rows with per-row copy. |
| `BinaryView` | Network vs host bit rendering with text legend. |
| `ExportControls` | Copy summary, JSON and CSV buttons. |
| `MaskConverter` | Two-way prefix ↔ mask conversion. |
| `SubnetSplitter` | Split form with paged results. |
| `VlsmPlanner` | Requirement editor, allocation table, usage bar, unused space. |
| `OverlapChecker` | Two-network comparison. |
| `HistoryPanel` | History list, remove, confirm-and-clear dialog. |

## Tests (`test/engine.test.ts`)

33 Vitest cases covering parsing, masks, `/0` `/31` `/32`, high first octets, invariants across all prefixes, splitting and pagination, overlap, VLSM (alignment, failures, validation, top of address space) and CSV export.
