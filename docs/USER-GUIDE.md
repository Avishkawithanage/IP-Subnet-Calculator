# User Guide

IP Subnet Calculator works on IPv4 only. Everything runs in your browser and nothing you type is sent to a server.

## Running the app

Requires Node.js 18 or newer.

```bash
npm install     # first time only
npm run dev     # then open http://localhost:5173
```

Other commands:

```bash
npm test          # run the 33 automated tests
npm run build     # production build into dist/
npm run preview   # serve the production build locally
```

The `dist/` folder is plain static files, so it can be hosted on GitHub Pages, Cloudflare Pages, Vercel or any static host.

## 1. Calculator tab

1. Type an IPv4 address (e.g. `192.168.10.25`) and a prefix (e.g. `24`).
   You can also paste `192.168.10.25/24` into the address box; both fields fill automatically.
2. Press **Calculate** (or Enter).
3. Read the results:
   - **Hero card**: the network in CIDR form, plus mask, class and scope (private, public, loopback, etc.).
   - **Stats**: total addresses, usable hosts, host bits.
   - **Details table**: input, subnet mask, wildcard mask, network, broadcast, first/last usable host, address class, scope. Each row has a **Copy** button.
   - **Binary view**: IP, mask and network in 32-bit binary. Bold letters with a solid underline are network bits; light letters with a dotted underline are host bits.
4. **Copy summary** copies a plain-text report. **Export JSON / Export CSV** download the result as `subnet-<network>-<prefix>.json/.csv`.
5. **Copy share link** copies a URL like `...#c=192.168.10.25%2F24`. Opening it recalculates automatically.
6. The **Try:** chips load common examples (private ranges, `/31`, `/32`).
7. **Clear** empties the form and result.

### Special prefixes

| Prefix | What you will see |
|---|---|
| `/0`–`/30` | Usable hosts = total − 2 (network and broadcast are reserved) |
| `/31` | Both addresses usable (point-to-point link, RFC 3021) |
| `/32` | A single host address |

### Input rules

- Exactly four octets, each 0–255, no leading zeros (`01` is rejected as ambiguous).
- Prefix is a whole number 0–32.
- Errors appear under the field with a message; your input is kept so you can fix it.

### Subnet mask converter

At the bottom of the Calculator tab. Type a prefix to get the mask, or type a mask to get the prefix. Masks that are not contiguous (such as `255.0.255.0`) are rejected.

### History

Each successful calculation is saved (last 20) in this browser only. Click an entry to reload it, ✕ to remove it, **Clear all** to wipe it (asks for confirmation). Clearing browser site data also removes history. If storage is blocked, a notice says history lasts only for the visit.

## 2. Subnet splitter tab

Divide a parent network into equal subnets.

1. Enter the parent in CIDR form (e.g. `192.168.10.0/24`) and a child prefix (e.g. `26`).
2. Press **Split**. You get each child's network, mask, first/last host, broadcast and usable hosts.
3. The child prefix cannot be shorter than the parent's.
4. Large splits are paged 64 rows at a time with **Previous / Next**. The header always shows the true total.

## 3. VLSM planner tab

Allocate different-sized subnets from one parent network.

1. Enter the parent network (e.g. `192.168.0.0/24`).
2. List each network with a unique name and the number of hosts it needs. Use **+ Add network** and ✕ to edit the list.
3. Optionally tick **Use /31 for 2-host links**.
4. Press **Allocate**.

How it works: requirements are sorted largest first, each gets the smallest block that fits its hosts (plus network and broadcast), and blocks are placed on aligned boundaries with no overlap.

Results show a usage bar, the allocation table, any requirements that **could not fit** (with the reason), and the **unused address space** as CIDR blocks.

## 4. Overlap checker tab

Enter two CIDR networks and press **Check**. You are told whether they are identical, one contains the other, or they are separate, and the overlapping range is shown. Host bits are ignored, so `10.0.0.5/24` equals `10.0.0.0/24`.

## 5. Theme and accessibility

- The sun/moon button switches light and dark theme; the choice is remembered.
- Everything works with the keyboard; focus is always visible.
- Errors and status messages are announced to screen readers.

## 6. Troubleshooting

| Message | Meaning |
|---|---|
| "must have exactly four octets" | Missing or extra dot-separated number |
| "Octet N is out of range" | A number above 255 |
| "has a leading zero" | Write `8`, not `08` |
| "Prefix /N is out of range" | Prefix must be 0–32 |
| "not a valid subnet mask" | Mask bits are not contiguous |
| "Child prefix cannot be shorter than the parent" | Choose a larger prefix number |
| "Copy failed" | Browser denied clipboard access; copy manually |
