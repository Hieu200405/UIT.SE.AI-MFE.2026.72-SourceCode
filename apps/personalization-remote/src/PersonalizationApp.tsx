import React, { useEffect, useMemo, useState } from 'react';
import { eventBus } from '@app/event-bus';
import { createFacadeClient } from '@app/facade-client';
import type { Profile, ProfileGender, RemoteProps, Region, ResidencePurpose } from '@app/shared-types';
import './styles.css';

(window.__reactCopies ||= []).push(React);

const PURPOSES: Array<[ResidencePurpose, string]> = [['long_term_travel', 'Long-term travel'], ['settling', 'Settling in Vietnam'], ['learning_culture', 'Learning the culture']];
const REGIONS: Array<[Region, string]> = [['north', 'North'], ['central', 'Central'], ['south', 'South']];
const GENDERS: Array<[ProfileGender, string]> = [['unknown', 'Prefer not to say'], ['female', 'Female'], ['male', 'Male']];
let version = 0; // chỉ để đánh số event trong phiên

const chip = (on: boolean) => 'profile:rounded-xl profile:border profile:px-4 profile:py-2 ' +
  (on ? 'profile:border-2 profile:border-teal-700 profile:bg-teal-50 profile:font-semibold profile:text-teal-800' : 'profile:border-stone-300 profile:bg-white');

export default function PersonalizationApp(props: Partial<RemoteProps>) {
  const facadeUrl = props.facadeUrl ?? 'http://localhost:4000';
  const client = useMemo(() => createFacadeClient({ baseUrl: facadeUrl }), [facadeUrl]);
  const [saved, setSaved] = useState<Profile | null>(null);
  const [p, setP] = useState<Profile | null>(null);
  const [age, setAge] = useState('');
  const [load, setLoad] = useState<'loading' | 'ready' | 'error'>('loading');
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err' | 'info'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = () => { setLoad('loading'); client.getProfile().then((x) => { setSaved(x); setP(x); setAge(x.age == null ? '' : String(x.age)); setLoad('ready'); }).catch(() => setLoad('error')); };
  useEffect(fetchProfile, [client]);

  if (load === 'loading') return <section data-testid="profile-loading" className="profile:p-4"><div className="profile:h-6 profile:w-32 profile:rounded profile:bg-stone-200" /><div className="profile:mt-3 profile:h-40 profile:rounded profile:bg-stone-200" /></section>;
  if (load === 'error' || !p || !saved) return (
    <section role="alert" data-testid="profile-error" className="profile:p-10 profile:text-center">
      <strong className="profile:text-lg">Your profile is temporarily unavailable</strong>
      <p className="profile:text-stone-600">We couldn’t load this section. Your practice conversations are not affected.</p>
      <button onClick={fetchProfile} className="profile:mt-3 profile:rounded-lg profile:bg-teal-700 profile:px-5 profile:py-2 profile:text-white">Retry</button>
    </section>);

  const save = async () => {
    const parsed = age.trim() === '' ? null : Number(age);
    if (parsed !== null && (!Number.isInteger(parsed) || parsed < 5 || parsed > 120)) return setMsg({ kind: 'err', text: 'Enter an age between 5 and 120.' });
    const next: Profile = { ...p, age: parsed };
    const changed = (Object.keys(next) as Array<keyof Profile>).filter((k) => next[k] !== saved[k]);
    if (!changed.length) return setMsg({ kind: 'info', text: 'No changes' });
    setSaving(true); setMsg(null);
    try {
      const stored = await client.putProfile(next);
      setSaved(stored); setP(stored); version += 1;
      eventBus.publish({ type: 'profileUpdated', payload: { profileVersion: version, changedFields: changed } });
      setMsg({ kind: 'ok', text: `Saved (v${version})` });
    } catch { setMsg({ kind: 'err', text: 'Couldn’t save your profile. Please try again.' }); }
    finally { setSaving(false); }
  };

  return (
    <section data-testid="profile" className="profile:flex profile:flex-col profile:gap-4 profile:p-4">
      <div><h2 className="profile:text-2xl profile:font-bold">My Profile</h2><p className="profile:text-stone-600">Tell us a little about your stay so practice feels relevant.</p></div>
      <div><div className="profile:mb-1 profile:font-semibold">Purpose of stay</div>
        <div role="group" aria-label="Purpose of stay" className="profile:flex profile:flex-wrap profile:gap-2">
          {PURPOSES.map(([v, l]) => <button key={v} aria-pressed={p.purpose === v} className={chip(p.purpose === v)} onClick={() => setP({ ...p, purpose: v })}>{l}</button>)}
        </div></div>
      <div className="profile:grid profile:gap-3 profile:sm:grid-cols-2">
        <label className="profile:flex profile:flex-col profile:gap-1 profile:font-semibold">Age
          <input aria-label="Age" inputMode="numeric" className="profile:rounded-xl profile:border profile:border-stone-300 profile:p-2 profile:font-normal" value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <label className="profile:flex profile:flex-col profile:gap-1 profile:font-semibold">Gender
          <select aria-label="Gender" className="profile:rounded-xl profile:border profile:border-stone-300 profile:p-2 profile:font-normal" value={p.gender} onChange={(e) => setP({ ...p, gender: e.target.value as ProfileGender })}>
            {GENDERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
      </div>
      <div><div className="profile:mb-1 profile:font-semibold">Region you live in</div>
        <div role="group" aria-label="Region you live in" className="profile:flex profile:gap-2">
          {REGIONS.map(([v, l]) => <button key={v} aria-pressed={p.region === v} className={chip(p.region === v)} onClick={() => setP({ ...p, region: v })}>{l}</button>)}
        </div>
        <p className="profile:mt-1 profile:text-sm profile:text-stone-500">Affects the AI’s voice and the local words you hear.</p></div>
      <div className="profile:flex profile:flex-wrap profile:items-center profile:gap-3">
        <button disabled={saving} onClick={save} className="profile:rounded-xl profile:bg-teal-700 profile:px-6 profile:py-2 profile:font-semibold profile:text-white profile:disabled:opacity-60">{saving ? 'Saving…' : 'Save'}</button>
        <span className="profile:text-sm profile:text-stone-500">Used to suggest scenarios and address terms.</span>
        {msg && <span data-testid="profile-msg" role={msg.kind === 'err' ? 'alert' : 'status'} className={'profile:text-sm ' + (msg.kind === 'err' ? 'profile:text-red-700' : 'profile:text-teal-800')}>{msg.text}</span>}
      </div>
    </section>
  );
}
