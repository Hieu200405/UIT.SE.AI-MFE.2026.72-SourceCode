import { validateScenarioForm } from '@app/shared-types';
import type { FormInteraction, ScenarioFormData } from '@app/shared-types';

export const MAX_UI_CHARS = 12_000;

/** LLM chooses content; Facade supplies identity. No scenario templates here. */
export function parseGeneratedForm(json: string): ScenarioFormData | null {
  if (json.length > MAX_UI_CHARS) return null;
  try {
    const value: unknown = JSON.parse(json);
    if (!value || typeof value !== 'object' || Array.isArray(value) || 'formId' in value) return null;
    const candidate = { ...value, formId: globalThis.crypto.randomUUID() };
    return validateScenarioForm(candidate) ? candidate : null;
  } catch { return null; }
}

export function validInteraction(form: ScenarioFormData, value: FormInteraction): boolean {
  return form.formId === value.formId && Object.keys(value.values).every((key) => form.fields.some((f) => f.id === key)) &&
    form.fields.every((f) => {
      const v = value.values[f.id] ?? '';
      return typeof v === 'string' && v.length <= 300 && (!f.required || v.trim().length > 0) &&
        (!(f.kind === 'select' || f.kind === 'choice') || (!v && !f.required) || f.options!.includes(v));
    });
}

/** Include the question and labels, not only opaque IDs; input stays in role user. */
export function interactionMessage(form: ScenarioFormData, values: Record<string, string>): string {
  return JSON.stringify({ type: 'ui_response', question: form.title, context: form.description,
    answers: form.fields.map((f) => ({ field: f.id, question: f.label, value: values[f.id] ?? '' })) });
}
