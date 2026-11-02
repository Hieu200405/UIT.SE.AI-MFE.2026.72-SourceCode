// Chỉ dùng phía server/test (Node). Engine thuần không đọc file.
import { readFileSync } from 'node:fs';
import type { AddressRule } from './types.ts';

export function loadRules(): AddressRule[] {
  const url = new URL('../data/rules.json', import.meta.url);
  return (JSON.parse(readFileSync(url, 'utf-8')) as { rules: AddressRule[] }).rules;
}
