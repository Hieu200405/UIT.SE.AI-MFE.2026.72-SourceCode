import type { ScenarioFormData } from '@app/shared-types';
import type { HistoryItem } from './prompt.ts';

/** Explicit VND only; never infer a currency from bare numbers. */
export function dongAmounts(text: string): number[] {
  return [...text.normalize('NFC').matchAll(/(?<![\d.,])\b(\d{1,3}(?:[.,\s\u202f]\d{3})+|\d+)\s*(nghìn|ngàn|k\b|đồng|đ(?!\p{L})|₫|VND\b)/giu)]
    .map(m => Number(m[1].replace(/[.,\s\u202f]/g, '')) * (/^(nghìn|ngàn|k)$/iu.test(m[2]) ? 1000 : 1));
}

/** Narrow guard: a total-only question immediately following one unambiguous quote.
 * Multiple prices, quantity changes and item additions require reasoning, not a guessed ledger.
 */
export function changedQuote(reply: string, history: HistoryItem[], message: string): boolean {
  if (!/^(?:tổng(?: cộng)?(?: là)? bao nhiêu(?: vậy| nhỉ)?|bao nhiêu tiền(?: vậy)?|(?:what(?:'s| is) )?(?:the )?total(?: please)?)\s*[?.!]*$/iu.test(message.trim())) return false;
  const last = history.at(-1);
  if (last?.role !== 'assistant') return false;
  const amounts = dongAmounts(last.text.split('\nInteractive question:')[0]);
  if (amounts.length !== 1) return false;
  // A newly quoted extra is not the whole order. Only anchor an explicit total,
  // or a lone price with no evidence of another item/quantity in history.
  if (!/tổng|total/iu.test(last.text.split('\nInteractive question:')[0])) {
    if (history.slice(0, -1).some(h => h.role === 'assistant' && dongAmounts(h.text.split('\nInteractive question:')[0]).some(n => n !== amounts[0]))) return false;
    if (history.some(h => h.role === 'user' && /(?:hai|ba|bốn|năm|sáu|bảy|tám|chín|mười|[2-9]\d*)\s+(?:phần|tô|bát|ly|cốc|suất|servings?|bowls?|cups?)/iu.test(h.text))) return false;
  }
  // A unit rate or an extra alone is not an order total.
  if (/mỗi|\/|phụ thu|each|per\b|extra/iu.test(last.text.split('\nInteractive question:')[0])) return false;
  const next = dongAmounts(reply);
  const known = new Set(history.filter(h => h.role === 'assistant').flatMap(h => dongAmounts(h.text.split('\nInteractive question:')[0])));
  return next.length > 0 && (!next.includes(amounts[0]) || next.some(amount => !known.has(amount)));
}

/** Conservative language check, not a general language detector. Options are practice
 * content. Explanations must be English; exact option names may occur within them.
 */
export function uiNeedsEnglish(form: ScenarioFormData, history: HistoryItem[] = []): boolean {
  const previousNames: string[] = [];
  for (const h of history) {
    const marker = '\nInteractive question: ';
    const at = h.text.indexOf(marker);
    if (h.role !== 'assistant' || at < 0) continue;
    try {
      const prior = JSON.parse(h.text.slice(at + marker.length));
      for (const f of prior.fields ?? []) for (const name of f.options ?? []) if (typeof name === 'string') previousNames.push(name);
    } catch { /* Historical context is optional. */ }
  }
  const names = [...previousNames, ...form.fields.flatMap(f => f.options ?? [])].sort((a,b) => b.length - a.length);
  const texts = [form.title, form.description, form.submitLabel,
    ...(form.summary ?? []).flatMap(row => [row.label]),
    ...form.fields.flatMap(f => [f.label, ...(f.optionDetails ?? []).flatMap(d =>
      [d.description, d.badge ?? '', ...(d.facts ?? []).flatMap(fact => [fact.label, fact.value])])])];
  return texts.some(text => {
    let rest = text.normalize('NFC').toLowerCase();
    for (const name of names) rest = rest.replaceAll(name.normalize('NFC').toLowerCase(), '');
    return /[ăâđêôơưàảãáạằẳẵắặầẩẫấậèẻẽéẹềểễếệìỉĩíịòỏõóọồổỗốộờởỡớợùủũúụừửữứựỳỷỹýỵ]/iu.test(rest);
  });
}
