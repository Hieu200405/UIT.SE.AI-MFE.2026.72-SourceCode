import type { ScenarioFormData } from '@app/shared-types';
import type { HistoryItem } from './prompt.ts';

export type DialogueIssue = 'mixed_script' | 'repeated_closer' | 'too_long' | 'unsolicited_payment' | 'repeated_question' | 'answered_question' | 'administrative_tone' | 'formulaic_closing' | 'closing_reopens' | 'incomplete_closing';
const fold = (s: string) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase();
const repeatRequest = (s: string) => /^(?:(?:please|can you|could you)\s+)?(?:repeat|say that again)\b|^(?:bạn\s+)?(?:nhắc|nói|hỏi)\s+lại/iu.test(s.trim());
const normalize = (s: string) => s.normalize('NFC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const closers = new Set(['bạn còn muốn gì nữa không', 'bạn còn muốn gì thêm không', 'bạn muốn gì thêm không', 'bạn còn cần gì nữa không', 'còn gì nữa không', 'bạn còn cần gì thêm không']);
const hasCloser = (text: string) => (text.match(/[^.!?\n]+\?/gu) ?? []).some((q) => closers.has(normalize(q)));

/** Narrow quality gate, not a grammar/culture evaluator. No rewriting or guessed facts. */
export function dialogueIssue(text: string, history: HistoryItem[], userMessage: string): DialogueIssue | null {
  if (text.length > 4000) return 'too_long';
  if ([...text].some((char) => /\p{L}/u.test(char) && !/\p{Script=Latin}/u.test(char))) return 'mixed_script';
  if (repeatRequest(userMessage)) return null;
  if (/rat (?:vui|han hanh).*phuc vu|(?:vinh hanh|han hanh) duoc|cam on.*(?:su tin tuong|da tin tuong|da lua chon)|chuc.*trai nghiem tuyet voi|luon san sang (?:ho tro|phuc vu)/.test(fold(text))) return 'formulaic_closing';
  if (isFarewell(userMessage) && /^(?:bac|chu|co|anh|chi|em|chau|ban|ong|ba) nhe(?:[,!.]|$)/.test(fold(text).trim())) return 'incomplete_closing';
  if (isFarewell(userMessage) && /[?？]/u.test(text)) return 'closing_reopens';
  if (paymentQuestion(text) && !asksPaymentMethod(userMessage)) return 'unsolicited_payment';
  if (/\b(?:minh|toi) (?:da )?(?:ghi nhan|cap nhat yeu cau)\b/.test(fold(text))) return 'administrative_tone';
  const recent = history.filter((h) => h.role === 'assistant').slice(-3);
  if (hasCloser(text) && recent.some((h) => hasCloser(h.text.split('\nInteractive question:')[0]))) return 'repeated_closer';
  const questions = text.match(/[^.!?\n]+\?/gu) ?? [];
  for (const question of questions) {
    if (!/\b(?:doi|thay|change|instead)\b/.test(fold(userMessage)) && recent.some(h => (h.text.split('\nInteractive question:')[0].match(/[^.!?\n]+\?/gu) ?? []).some(q => normalize(q) === normalize(question)))) return 'repeated_question';
    if (answeredTopic(question, userMessage)) return 'answered_question';
  }
  return null;
}

export function isFarewell(message: string): boolean {
  return /(?:tam biet|hen gap lai(?: nhe)?|lan sau (?:minh|toi|chau|em) (?:se )?(?:quay lai|ghe lai)|(?:minh|toi|chau|em) (?:ve|di) truoc(?: nhe)?|goodbye|bye|see you(?: later| tomorrow)?)[.!\s]*$/iu.test(fold(message));
}

export function asksPaymentMethod(message: string): boolean {
  const m = fold(message);
  if (/dung|khong hoi|don't|do not/.test(m)) return false;
  return /(?:tra|thanh toan).*(?:cach nao|the nao|bang gi|duoc khong)|(?:co|nhan)\b.*\b(?:the|tien mat|chuyen khoan)\b.*(?:khong|duoc)|(?:how|can i|could i).*(?:pay|cash|card)|payment (?:methods?|options?)/.test(m);
}

export function paymentQuestion(text: string): boolean {
  const t = fold(text);
  return /(?:tra (?:tien|bang)|thanh toan|tien mat|chuyen khoan|cash|card|pay(?:ment)?)[^.!?\n]*\?|(?:tien mat.*hay.*the|cash.*or.*card)/.test(t);
}

function answeredTopic(question: string, message: string): boolean {
  const q = fold(question); let answer = message;
  // Only values, never the question/options embedded in submitted UI metadata.
  try { const data = JSON.parse(message); if (data.type === 'ui_response') answer = data.answers.map((a: { value: string }) => a.value).join(' '); } catch { /* ordinary chat */ }
  const a = fold(answer);
  if (/bao nhieu (?:phan|to|bat|ly|coc|suat)|how many|quantity|number of (?:servings|bowls)/.test(q)) return /(?:mot|hai|ba|bon|nam|sau|bay|tam|chin|muoi|one|two|three|\d+)\s+(?:phan|to|bat|ly|coc|suat|servings?|bowls?|cups?)/.test(a);
  if (/cay.*khong|do cay|spic(?:e|y|iness)/.test(q)) return /khong cay|it cay|cay vua|rat cay|not spicy|non.spicy|mild|medium|very spicy/.test(a);
  if (/an (?:o|tai) day.*mang|dine.in|eat here|takeaway|takeout|dining/.test(q)) return /an (?:o|tai) day|mang ve|eat here|dine.in|takeaway|takeout/.test(a);
  return false;
}

/** Validate the question, not summaries of settled choices. */
export function uiConversationIssue(form: ScenarioFormData, history: HistoryItem[], message: string): DialogueIssue | null {
  if (repeatRequest(message)) return null;
  if (isFarewell(message)) return 'closing_reopens';
  for (const field of form.fields) {
    const q = `${form.title} ${field.label}`;
    const payment = /payment|pay(?:ment)? method|cash|credit card|thanh toan|tien mat|chuyen khoan/.test(fold(q + ' ' + (field.options ?? []).join(' ')));
    if (payment && !asksPaymentMethod(message)) return 'unsolicited_payment';
    if (answeredTopic(field.label, message)) return 'answered_question';
    // Reopening choices is intentional when the learner asks to change/compare them.
    if (/doi|thay|change|instead|compare|so sanh/.test(fold(message))) continue;
    for (const h of history.filter(h => h.role === 'assistant').slice(-3)) {
      const marker = '\nInteractive question: '; const at = h.text.indexOf(marker);
      if (at < 0) continue;
      try {
        const prior = JSON.parse(h.text.slice(at + marker.length));
        if (prior.fields?.some((f: { label: string; options?: string[] }) => normalize(f.label) === normalize(field.label) && JSON.stringify(f.options ?? []) === JSON.stringify(field.options ?? []))) return 'repeated_question';
      } catch { /* optional history */ }
    }
  }
  return null;
}
