import { parseCidr } from '../features/calculator/subnet';
import { InputError } from '../features/calculator/types';

export function errorMessage(e: unknown): string {
  return e instanceof InputError ? e.message : 'Something went wrong. Please check your input.';
}

/** Split a combined field ("1.2.3.4/24") into address + prefix strings for the form. */
export function splitCombined(text: string): { address: string; prefix: string } | null {
  try {
    const { address, prefix } = parseCidr(text);
    return { address, prefix: String(prefix) };
  } catch {
    return null;
  }
}
