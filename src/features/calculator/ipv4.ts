import { InputError } from './types';

/** Parse strict dotted-decimal IPv4 into an unsigned 32-bit integer. */
export function parseIpv4(text: string, field = 'address'): number {
  const s = text.trim();
  if (s === '') throw new InputError('Enter an IPv4 address, e.g. 192.168.10.25.', field);
  const parts = s.split('.');
  if (parts.length !== 4) {
    throw new InputError(`"${s}" must have exactly four octets separated by dots.`, field);
  }
  let value = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) {
      throw new InputError(`Octet "${part}" is not a valid decimal number.`, field);
    }
    if (part.length > 1 && part.startsWith('0')) {
      throw new InputError(`Octet "${part}" has a leading zero, which is ambiguous.`, field);
    }
    const n = Number(part);
    if (n > 255) throw new InputError(`Octet ${n} is out of range (0–255).`, field);
    value = value * 256 + n;
  }
  return value >>> 0;
}

export function formatIpv4(value: number): string {
  const v = value >>> 0;
  return [v >>> 24, (v >>> 16) & 255, (v >>> 8) & 255, v & 255].join('.');
}

export function toBinaryOctets(value: number): string {
  const bits = (value >>> 0).toString(2).padStart(32, '0');
  return [bits.slice(0, 8), bits.slice(8, 16), bits.slice(16, 24), bits.slice(24)].join('.');
}

export function isValidIpv4(text: string): boolean {
  try {
    parseIpv4(text);
    return true;
  } catch {
    return false;
  }
}
