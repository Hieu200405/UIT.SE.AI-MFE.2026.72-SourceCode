import type { HistoryItem } from './prompt.ts';

export type DialogueIssue = 'mixed_script' | 'repeated_closer' | 'too_long';
const normalize = (s: string) => s.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const closers = new Set(['bạn còn muốn gì nữa không', 'bạn còn muốn gì thêm không', 'bạn muốn gì thêm không', 'bạn còn cần gì nữa không', 'còn gì nữa không', 'bạn còn cần gì thêm không']);
const hasCloser = (text: string) => (text.match(/[^.!?\n]+\?/gu) ?? []).some((q) => closers.has(normalize(q)));

/** Narrow quality gate, not a grammar/culture evaluator. No rewriting or guessed facts. */
export function dialogueIssue(text: string, history: HistoryItem[], userMessage: string): DialogueIssue | null {
  if (text.length > 4000) return 'too_long';
  if ([...text].some((char) => /\p{L}/u.test(char) && !/\p{Script=Latin}/u.test(char))) return 'mixed_script';
  if (/^(?:(?:please|can you|could you)\s+)?(?:repeat|say that again)\b|^(?:bạn\s+)?(?:nhắc|nói|hỏi)\s+lại/iu.test(userMessage.trim())) return null;
  const recent = history.filter((h) => h.role === 'assistant').slice(-3);
  if (hasCloser(text) && recent.some((h) => hasCloser(h.text.split('\nInteractive question:')[0]))) return 'repeated_closer';
  return null;
}
