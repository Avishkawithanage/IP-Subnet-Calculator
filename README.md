# IP Subnet Calculator

An IPv4 subnet calculator built with React and TypeScript. It calculates CIDR network details and provides subnet splitting, VLSM planning, overlap detection, binary visualization, local history, and export tools. Everything runs in the browser; nothing you enter is sent anywhere.

## Features

- **Calculator**: network, broadcast, subnet and wildcard masks, first/last host, total and usable addresses, class and scope. Accepts `ip` + `prefix`, or a pasted `ip/prefix`.
- **Binary view**: 32-bit IP, mask and network with network and host bits distinguished by weight and underline style, not colour alone.
- **Mask converter**: CIDR ↔ dotted mask, rejects non-contiguous masks (e.g. `255.0.255.0`).
- **Subnet splitter**: equal-size children with pagination (nothing is silently truncated).
- **VLSM planner**: largest-first, aligned allocation; reports requirements that do not fit; shows unused space; optional `/31` for 2-host links.
- **Overlap checker**: identical / contains / disjoint, with the intersection.
- **History** (localStorage, survives corrupt or disabled storage), **copy**, **JSON/CSV export**, **share links** (`#c=ip/prefix`), light/dark theme.

## Host-count convention

| Prefix | Behaviour |
|---|---|
| `/0`–`/30` | usable = total − 2 (network and broadcast reserved) |
| `/31` | both addresses usable (RFC 3021 point-to-point) |
| `/32` | one address, a single host route |

## Develop

```bash
npm install
npm run dev        # start dev server
npm run typecheck  # TypeScript
npm test           # Vitest (33 tests)
npm run build      # production build in dist/
```

## Documentation

- [User guide](docs/USER-GUIDE.md)
- [Function reference](docs/FUNCTIONS.md)

## Structure

`src/features/calculator` is the pure, UI-independent engine (unsigned 32-bit arithmetic via `>>> 0`); `src/components` is the React UI; tests live in `src/test`.

## Example

`192.168.10.25/24` → network `192.168.10.0`, mask `255.255.255.0`, broadcast `192.168.10.255`, hosts `192.168.10.1`–`.254`, 256 addresses, 254 usable.
