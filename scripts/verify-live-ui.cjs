// Real browser -> running Facade -> real provider. No request interception or fixture.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const facade = process.env.LIVE_FACADE_URL || 'http://localhost:4000';
const host = process.env.LIVE_HOST_URL || 'http://localhost:3000';
const output = path.resolve('test-results/live-llm');
const events = [];
const pending = [];
let browser;
let page;
const report = { status: 'not_run', checks: {}, events, error: null };
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const health = await (await fetch(facade + '/health', { signal: AbortSignal.timeout(5000) })).json();
  if (health.mode !== 'llm' || health.dev !== false) throw new Error('Requires a running real LLM Facade with dev=false.');
  report.checks.health = health;
  browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined, headless: process.env.LIVE_HEADED !== '1' });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.on('response', (response) => {
    if (!response.url().startsWith(facade + '/chat/stream')) return;
    pending.push(response.text().then((raw) => {
      for (const line of raw.split('\n')) if (line.startsWith('data: ')) {
        try { events.push(JSON.parse(line.slice(6))); } catch {}
      }
    }).catch(() => {}));
  });
  const done = async () => {
    await page.getByTestId('replying').waitFor({ state: 'hidden', timeout: 90000 });
    if (await page.getByTestId('chat-error').count()) throw new Error(await page.getByTestId('chat-error').innerText());
  };
  await page.goto(host + '/chat?facade=' + encodeURIComponent(facade) + '&streamTimeout=45000');
  await page.getByTestId('scenario-street_food').click();
  await page.getByTestId('agent-text').first().or(page.getByTestId('chat-error')).first().waitFor({ timeout: 90000 });
  await done();
  await page.getByLabel('Your reply').fill('I want to practise ordering food. I am not sure what to choose. Could you help me choose a dish and how spicy to make it?');
  await page.getByTestId('send-button').click();
  await done();
  const forms = page.getByTestId('scenario-form');
  const count = await forms.count();
  if (!count) throw new Error('The model did not produce a valid interactive UI for this conversation.');
  const form = forms.last();
  if (!(await form.getByRole('button', { name: 'Submitted', exact: true }).count()) && await form.locator('button[type=submit]').isEnabled()) {
    const controls = await form.locator('select,input,textarea').count();
    const radioNames = new Set();
    for (let i = 0; i < controls; i++) {
      const field = form.locator('select,input,textarea').nth(i);
      const tag = await field.evaluate((el) => el.tagName);
      const type = await field.getAttribute('type');
      if (tag === 'SELECT') {
        const values = await field.locator('option').evaluateAll((options) => options.map((o) => o.value).filter(Boolean));
        await field.selectOption(values[0]);
      } else if (type === 'radio') {
        const name = await field.getAttribute('name');
        if (!radioNames.has(name)) { await field.check(); radioNames.add(name); }
      } else await field.fill('For this practice: one serving, not spicy.');
    }
    await form.screenshot({ path: path.join(output, 'generated-ui.png') });
    report.checks.generatedUI = await form.innerText();
    const before = await page.getByTestId('msg-agent').count();
    await form.locator('button[type=submit]').click();
    await done();
    if (await page.getByTestId('msg-agent').count() <= before) throw new Error('No agent reply after interaction.');
    report.checks.followup = await page.getByTestId('msg-agent').last().innerText();
    await page.screenshot({ path: path.join(output, 'after-interaction.png'), fullPage: true });
    report.status = 'passed';
  } else throw new Error('No active generated form to submit.');
})().catch(async (error) => {
  report.status = 'failed'; report.error = error.message; process.exitCode = 1;
  if (page) {
    report.checks.visibleErrors = await page.getByTestId('chat-error').allTextContents().catch(() => []);
    await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
  }
}).finally(async () => {
  await browser?.close();
  await Promise.allSettled(pending);
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, error: report.error, report: path.join(output, 'report.json') }));
});
