import React, { useRef, useState } from 'react';
import type { FormInteraction, ScenarioFormData } from '@app/shared-types';
import { Icon } from './Icons';

export function ScenarioForm({ data, disabled, submitted, onSubmit }: {
  data: ScenarioFormData; disabled: boolean; submitted: boolean;
  onSubmit: (interaction: FormInteraction, summary: string) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(data.fields.map((f) => [f.id, ''])));
  const sent = useRef(false);
  const [error, setError] = useState('');
  const change = (key: string, value: string) => { setValues((v) => ({ ...v, [key]: value })); setError(''); };
  const answers = data.fields.filter((f) => values[f.id]?.trim());
  const closed = submitted || sent.current;
  if (closed) return <div data-testid="scenario-form" className="chat:agent-receipt">
    <details>
      <summary className="chat:receipt-toggle">
        <span className="chat:receipt-icon" aria-hidden="true"><Icon name={sent.current ? 'check' : 'speech'} size={15} /></span>
        <span className="chat:receipt-copy"><span className="chat:receipt-title">{data.title}</span><span className="chat:receipt-value">{sent.current ? answers.map((f) => values[f.id]).join(' · ') || 'Response sent' : 'Continued in chat'}</span></span>
        <span className="chat:receipt-status">{sent.current ? 'Sent' : 'Closed'}</span>
        <span className="chat:receipt-chevron" aria-hidden="true">⌄</span>
      </summary>
      <div className="chat:receipt-detail">
        <p>{sent.current ? 'Your response was sent to the agent. If the reply is interrupted, use Retry below.' : 'This question was replaced by your next message.'}</p>
        {sent.current && <dl>{answers.map((f) => <div key={f.id} className="chat:receipt-row"><dt>{f.label}</dt><dd>{values[f.id]}</dd></div>)}</dl>}
        <p className="chat:mt-2">Want to change something? Tell your agent in the chat.</p>
      </div>
    </details>
  </div>;
  return (
    <form data-testid="scenario-form" aria-label={data.title} className="chat:agent-form" onSubmit={(e) => {
      e.preventDefault();
      if (disabled || submitted || sent.current) return;
      if (data.fields.some((f) => f.required && !values[f.id]?.trim())) { setError('Complete the required fields to continue.'); return; }
      sent.current = true;
      const summary = `${data.title}: ` + answers.map((f) => `${f.label}: ${values[f.id]}`).join(' · ');
      onSubmit({ formId: data.formId, values }, summary);
    }}>
      <div className="chat:form-heading">
        <span className="chat:form-mark" aria-hidden="true"><Icon name="speech" size={18} /></span>
        <div><div className="chat:form-eyebrow">{data.fields.some((f) => f.presentation === 'comparison') ? 'Explore your options' : 'Your next choice'}</div><h3 className="chat:form-title">{data.title}</h3></div>
      </div>
      <p className="chat:form-description">{data.description}</p>
      {data.summary && <div className="chat:decision-summary"><div className="chat:summary-label">So far in our conversation</div><dl>{data.summary.map((row) => <div key={row.label} className="chat:summary-row"><dt>{row.label}</dt><dd>{row.value}</dd></div>)}</dl></div>}
      <fieldset disabled={disabled} className="chat:form-fields">
        {data.fields.map((field) => {
          const label = field.label + (field.required ? ' *' : ' (optional)');
          if (field.kind === 'choice') return <fieldset key={field.id} className="chat:choice-field">
            <legend className="chat:field-label">{label}</legend>
            {field.presentation === 'comparison' && <p className="chat:comparison-hint">Compare the details, then choose what fits.</p>}
            <div className={field.presentation === 'compact' ? 'chat:compact-choices' : field.presentation === 'comparison' ? 'chat:comparison-grid' : 'chat:choice-grid'}>{field.options?.map((option, index) => { const detail = field.optionDetails?.find((d) => d.option === option); return <label key={option} className={'chat:choice-card ' + (values[field.id] === option ? 'chat:choice-selected' : '')}>
              <input type="radio" name={`${data.formId}-${field.id}`} value={option} aria-label={option} aria-describedby={detail ? `${data.formId}-${field.id}-${index}-detail` : undefined} checked={values[field.id] === option} required={field.required} onChange={() => change(field.id, option)} className="chat:choice-input" />
              <span className="chat:choice-number" aria-hidden="true">{detail?.icon ? <Icon name={detail.icon} size={25} /> : String(index + 1).padStart(2, '0')}</span>
              <span className="chat:choice-text">{option}</span>
              {detail && <span id={`${data.formId}-${field.id}-${index}-detail`} className="chat:choice-description">{detail.description}</span>}
              {detail?.badge && <span className="chat:choice-badge">{detail.badge}</span>}
              {detail?.facts && <span className="chat:option-facts">{detail.facts.map((fact) => <span key={fact.label} className="chat:option-fact"><span className="chat:fact-label">{fact.label}</span><span className="chat:fact-value">{fact.value}</span></span>)}</span>}
              {field.presentation === 'comparison' && <span className="chat:comparison-action">{values[field.id] === option ? 'Selected' : 'Choose this option'}</span>}
              <span className="chat:choice-indicator" aria-hidden="true">{values[field.id] === option ? '✓' : ''}</span>
            </label>; })}</div>
          </fieldset>;
          return <label key={field.id} className="chat:field-label">
            {label}
            {field.kind === 'select' ? <select className="chat:field-input" value={values[field.id]} required={field.required} onChange={(e) => change(field.id, e.target.value)}>
              <option value="">Choose an option</option>{field.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select> : field.kind === 'textarea' ? <textarea className="chat:field-input" placeholder="A little context helps…" rows={3} maxLength={300} required={field.required} value={values[field.id]} onChange={(e) => change(field.id, e.target.value)} /> :
              <input className="chat:field-input" placeholder="Your answer…" maxLength={300} required={field.required} value={values[field.id]} onChange={(e) => change(field.id, e.target.value)} />}
          </label>;
        })}
        {error && <p role="alert" className="chat:text-sm chat:text-red-700">{error}</p>}
        {answers.length > 0 && <div className="chat:selection-preview" data-testid="selection-preview" aria-live="polite" aria-atomic="true"><span className="chat:selection-heading">Your selection · not sent yet</span><span>{answers.map((f) => `${f.label}: ${values[f.id]}`).join(' · ')}</span></div>}
        <div className="chat:form-footer"><span className="chat:form-caption">{disabled ? 'Waiting for the agent…' : 'Or tell me in your own words'}</span><button type="submit" className="chat:form-submit">{data.submitLabel}<span aria-hidden="true">→</span></button></div>
      </fieldset>
    </form>
  );
}
