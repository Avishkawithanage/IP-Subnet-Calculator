import { formatIpv4, parseIpv4, toBinaryOctets } from './ipv4';
import { maskToPrefix, parsePrefix, prefixToMask, prefixToMaskString } from './subnet-mask';
import { ChildSubnet, InputError, OverlapResult, SubnetResult } from './types';

export interface Block {
  network: number;
  prefix: number;
}

export function blockSize(prefix: number): number {
  return 2 ** (32 - prefix);
}

export function broadcastOf(network: number, prefix: number): number {
  return (network + blockSize(prefix) - 1) >>> 0;
}

export function hostInfo(network: number, prefix: number) {
  const total = blockSize(prefix);
  const broadcast = broadcastOf(network, prefix);
  if (prefix === 32) {
    return {
      usable: 1,
      first: formatIpv4(network),
      last: formatIpv4(network),
      note: '/32 is a single-address prefix (host route). The one address is the host itself.',
    };
  }
  if (prefix === 31) {
    return {
      usable: 2,
      first: formatIpv4(network),
      last: formatIpv4(broadcast),
      note: '/31 point-to-point link (RFC 3021): both addresses are usable, no network/broadcast reservation.',
    };
  }
  return {
    usable: total - 2,
    first: formatIpv4(network + 1),
    last: formatIpv4(broadcast - 1),
    note: `Conventional: ${total.toLocaleString('en-US')} addresses minus network and broadcast.`,
  };
}

function classify(ip: number): { ipClass: string; scope: string } {
  const a = ip >>> 24;
  const b = (ip >>> 16) & 255;
  const ipClass = a < 128 ? 'A' : a < 192 ? 'B' : a < 224 ? 'C' : a < 240 ? 'D (multicast)' : 'E (reserved)';
  let scope = 'Public';
  if (a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)) scope = 'Private (RFC 1918)';
  else if (a === 127) scope = 'Loopback';
  else if (a === 169 && b === 254) scope = 'Link-local (APIPA)';
  else if (a === 100 && b >= 64 && b <= 127) scope = 'Carrier-grade NAT';
  else if (a === 0) scope = 'This network';
  else if (a >= 224 && a <= 239) scope = 'Multicast';
  else if (a >= 240) scope = 'Reserved';
  return { ipClass, scope };
}

export function calculateSubnet(address: string, prefixInput: string | number): SubnetResult {
  const ip = parseIpv4(address, 'address');
  const prefix = parsePrefix(prefixInput, 'prefix');
  const mask = prefixToMask(prefix);
  const network = (ip & mask) >>> 0;
  const wildcard = ~mask >>> 0;
  const broadcast = (network | wildcard) >>> 0;
  const info = hostInfo(network, prefix);
  return {
    inputAddress: formatIpv4(ip),
    prefix,
    cidr: `${formatIpv4(network)}/${prefix}`,
    subnetMask: formatIpv4(mask),
    wildcardMask: formatIpv4(wildcard),
    networkAddress: formatIpv4(network),
    broadcastAddress: formatIpv4(broadcast),
    totalAddresses: blockSize(prefix),
    usableHostCount: info.usable,
    firstUsableAddress: info.first,
    lastUsableAddress: info.last,
    hostCountNote: info.note,
    ...classify(ip),
    binary: { address: toBinaryOctets(ip), mask: toBinaryOctets(mask), network: toBinaryOctets(network) },
  };
}

/** Accepts "a.b.c.d/nn" or "a.b.c.d/255.255.255.0". */
export function parseCidr(text: string, field = 'cidr'): { address: string; prefix: number } {
  const s = text.trim();
  if (s === '') throw new InputError('Enter a network in CIDR notation, e.g. 192.168.10.0/24.', field);
  const parts = s.split('/');
  if (parts.length !== 2) throw new InputError(`"${s}" must look like 192.168.10.0/24.`, field);
  const [addr, p] = parts;
  parseIpv4(addr, field);
  const prefix = p.includes('.') ? maskToPrefix(p, field) : parsePrefix(p, field);
  return { address: addr.trim(), prefix };
}

export function parseBlock(text: string, field = 'cidr'): Block {
  const { address, prefix } = parseCidr(text, field);
  const network = (parseIpv4(address, field) & prefixToMask(prefix)) >>> 0;
  return { network, prefix };
}

export function makeChild(network: number, prefix: number, index: number): ChildSubnet {
  const info = hostInfo(network, prefix);
  return {
    index,
    networkAddress: formatIpv4(network),
    prefix,
    cidr: `${formatIpv4(network)}/${prefix}`,
    subnetMask: prefixToMaskString(prefix),
    broadcastAddress: formatIpv4(broadcastOf(network, prefix)),
    totalAddresses: blockSize(prefix),
    usableHostCount: info.usable,
    firstUsableAddress: info.first,
    lastUsableAddress: info.last,
  };
}

export interface SplitResult {
  parent: string;
  childPrefix: number;
  totalChildren: number;
  offset: number;
  subnets: ChildSubnet[];
}

/** Split into equal subnets; returns one page (offset/limit) and the true total. */
export function splitSubnet(parentText: string, childPrefixInput: string | number, offset = 0, limit = 64): SplitResult {
  const parent = parseBlock(parentText, 'parent');
  const childPrefix = parsePrefix(childPrefixInput, 'childPrefix');
  if (childPrefix < parent.prefix) {
    throw new InputError(`Child prefix /${childPrefix} cannot be shorter than the parent /${parent.prefix}.`, 'childPrefix');
  }
  const total = 2 ** (childPrefix - parent.prefix);
  const size = blockSize(childPrefix);
  const start = Math.max(0, Math.min(offset, total));
  const end = Math.min(total, start + limit);
  const subnets: ChildSubnet[] = [];
  for (let i = start; i < end; i++) subnets.push(makeChild((parent.network + i * size) >>> 0, childPrefix, i));
  return {
    parent: `${formatIpv4(parent.network)}/${parent.prefix}`,
    childPrefix,
    totalChildren: total,
    offset: start,
    subnets,
  };
}

export function checkOverlap(aText: string, bText: string): OverlapResult {
  const a = parseBlock(aText, 'a');
  const b = parseBlock(bText, 'b');
  const aEnd = broadcastOf(a.network, a.prefix);
  const bEnd = broadcastOf(b.network, b.prefix);
  const fmt = (x: Block) => `${formatIpv4(x.network)}/${x.prefix}`;
  if (a.network > bEnd || b.network > aEnd) {
    return { relation: 'disjoint', overlaps: false, intersection: null, explanation: `${fmt(a)} and ${fmt(b)} share no addresses.` };
  }
  if (a.network === b.network && a.prefix === b.prefix) {
    return { relation: 'identical', overlaps: true, intersection: fmt(a), explanation: `Both describe the same network ${fmt(a)}.` };
  }
  if (a.prefix < b.prefix) {
    return { relation: 'a-contains-b', overlaps: true, intersection: fmt(b), explanation: `${fmt(a)} fully contains ${fmt(b)}.` };
  }
  return { relation: 'b-contains-a', overlaps: true, intersection: fmt(a), explanation: `${fmt(b)} fully contains ${fmt(a)}.` };
}
