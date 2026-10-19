import { formatIpv4, parseIpv4 } from './ipv4';
import { InputError } from './types';

export function parsePrefix(text: string | number, field = 'prefix'): number {
  const s = String(text).trim().replace(/^\//, '');
  if (s === '') throw new InputError('Enter a prefix length from 0 to 32.', field);
  if (!/^\d+$/.test(s)) throw new InputError(`Prefix "${s}" must be a whole number from 0 to 32.`, field);
  const n = Number(s);
  if (n > 32) throw new InputError(`Prefix /${n} is out of range (0–32).`, field);
  return n;
}

/** 32-bit mask as unsigned int; /0 handled explicitly. */
export function prefixToMask(prefix: number): number {
  if (prefix <= 0) return 0;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

export function prefixToMaskString(prefix: number): string {
  return formatIpv4(prefixToMask(prefix));
}

/** Convert a dotted mask to a prefix; rejects non-contiguous masks. */
export function maskToPrefix(maskText: string, field = 'mask'): number {
  const mask = parseIpv4(maskText, field);
  let prefix = 0;
  let m = mask;
  while (prefix < 32 && (m & 0x80000000) !== 0) {
    prefix++;
    m = (m << 1) >>> 0;
  }
  if (m !== 0) {
    throw new InputError(
      `${maskText.trim()} is not a valid subnet mask: 1-bits must be contiguous, followed only by 0-bits.`,
      field,
    );
  }
  return prefix;
}
