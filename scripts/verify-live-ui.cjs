// Real browser -> running Facade -> real provider. No request interception or fixture.
const { chromium } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const facade = process.env.LIVE_FACADE_URL || 'http://localhost:4000';
const host = process.env.LIVE_HOST_URL || 'http://localhost:3000';
const output = path.resolve(process.env.LIVE_OUTPUT_DIR || 'test-results/live-llm');
const paceMs = Math.min(60000, Math.max(5000, Number(process.env.LIVE_PACE_MS) || 5000));
const events = [];
const pending = [];
let browser;
let page;
const report = { status: 'not_run', checks: { recoveredErrors: [] }, events, error: null };
(async () => {
  fs.mkdirSync(output, { recursive: true });
  const health = await (await fetch(facade + '/health', { signal: AbortSignal.timeout(5000) })).json();
  if (health.mode !== 'llm' || health.dev !== false) throw new Error('Requires a running real LLM Facade with dev=false.');
  report.checks.health = health;
  browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH || undefined, headless: process.env.LIVE_HEADED !== '1' });
  page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  page.setDefaultTimeout(15000);
  page.on('response', (response) => {
    if (!response.url().startsWith(facade + '/chat/stream')) return;
    pending.push(response.body().then((body) => {
      const raw = body.toString('utf8');
      for (const line of raw.split('\n')) if (line.startsWith('data: ')) {
        try { events.push(JSON.parse(line.slice(6))); } catch {}
      }
    }).catch(() => {}));
  });
  const done = async () => {
    await page.getByTestId('replying').waitFor({ state: 'hidden', timeout: 90000 });
    if (await page.getByTestId('chat-error').count()) {
      const error = await page.getByTestId('chat-error').innerText();
      const retry = page.getByTestId('chat-error').getByRole('button', { name: 'Retry', exact: true });
      if (process.env.LIVE_RETRY_ONCE === '1' && /connection to the AI service was lost|AI connection ended/.test(error) && await retry.count()) {
        await page.waitForTimeout(2000); await retry.click();
        await page.getByTestId('replying').waitFor({ state: 'hidden', timeout: 90000 });
        if (!await page.getByTestId('chat-error').count()) { report.checks.recoveredErrors.push(error); return; }
      }
      throw new Error(error);
    }
    const speech = await page.getByTestId('agent-text').last().innerText().catch(() => '');
    if (/Interactive question:|"fields"\s*:|<\/?(?:vi|en|ui)>/.test(speech)) throw new Error('Protocol/UI metadata leaked into visible dialogue.');
  };
  await page.goto(host + '/chat?facade=' + encodeURIComponent(facade) + '&streamTimeout=45000');
  await page.getByTestId('scenario-street_food').click();
  await page.getByTestId('agent-text').first().or(page.getByTestId('chat-error')).first().waitFor({ timeout: 90000 });
  await done();
  await page.waitForTimeout(paceMs);
  await page.getByLabel('Your reply').fill(process.env.LIVE_COMPARISON === '1' ? 'Please compare phở bò and bánh mì thịt by texture and how they are served so I can pick one. I want it not spicy.' : 'I want to practise ordering food. I am not sure what to choose. Could you help me choose a dish and how spicy to make it?');
  await page.getByTestId('send-button').click();
  await done();
  const forms = page.getByTestId('scenario-form');
  const count = await forms.count();
  if (!count) throw new Error('The model did not produce a valid interactive UI for this conversation.');
  const form = forms.last();
  if (process.env.LIVE_COMPARISON === '1') {
    if (!await form.locator('[class~="chat:comparison-grid"]').count()) throw new Error('Expected a model-generated comparison, but no comparison UI was returned.');
    report.checks.comparison = await form.innerText();
  }
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
    if (process.env.LIVE_COMPARISON === '1') {
      report.checks.selectionPreview = await form.getByTestId('selection-preview').innerText();
      await page.setViewportSize({ width: 390, height: 844 });
      await form.screenshot({ path: path.join(output, 'comparison-mobile.png') });
      if (!await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)) throw new Error('Comparison overflows mobile viewport.');
      await page.setViewportSize({ width: 1280, height: 900 });
    }
    const before = await page.getByTestId('msg-agent').count();
    await page.waitForTimeout(paceMs);
    await form.locator('button[type=submit]').click();
    await done();
    if (await page.getByTestId('msg-agent').count() <= before) throw new Error('No agent reply after interaction.');
    report.checks.followup = await page.getByTestId('msg-agent').last().innerText();
    await page.screenshot({ path: path.join(output, 'after-interaction.png'), fullPage: true });
    report.checks.extendedDialogue = [];
    const followups = Math.min(12, Math.max(0, Number(process.env.LIVE_FOLLOWUP_TURNS || 0)));
    for (let turn = 0; turn < followups; turn++) {
      await page.waitForTimeout(paceMs);
      const prompts = process.env.LIVE_COMPARISON === '1' ? ['Ăn ở đây, cho thêm rau nhé.', 'Tổng bao nhiêu vậy?', 'Mình trả tiền mặt nhé.', 'Cho xin thêm khăn giấy.'] : ['Ăn ở đây, cho thêm rau nhé.', 'Có trà đá không?', 'Cho một ly thôi, ít đá.', 'Tổng bao nhiêu vậy?', 'Mình trả tiền mặt nhé.', 'Cho xin thêm khăn giấy.', 'Món này có hành không?', 'Lần sau mình muốn thử món khác. Có món nào nữa?', 'Giúp mình chọn hai món để so sánh nhé.', 'Giữ món không cay nhé.'];
      await page.getByLabel('Your reply').fill(prompts[turn % prompts.length]);
      await page.getByTestId('send-button').click(); await done();
      report.checks.extendedDialogue.push({ turn: turn + 1, prompt: prompts[turn % prompts.length], reply: await page.getByTestId('msg-agent').last().innerText() });
      fs.writeFileSync(path.join(output, 'progress.json'), JSON.stringify({ status: 'running', completedFollowups: turn + 1, dialogue: report.checks.extendedDialogue }, null, 2));
    }
    if (followups) await page.screenshot({ path: path.join(output, 'long-conversation.png'), fullPage: true });
    report.status = 'passed';
  } else throw new Error('No active generated form to submit.');
})().catch(async (error) => {
  report.status = 'failed'; report.error = error.message; process.exitCode = 1;
  if (page) {
    report.checks.visibleErrors = await page.getByTestId('chat-error').allTextContents().catch(() => []);
    await page.screenshot({ path: path.join(output, 'failure.png'), fullPage: true }).catch(() => {});
  }
}).finally(async () => {
  await Promise.allSettled(pending);
  await browser?.close();
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(path.join(output, 'report.json'), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ status: report.status, error: report.error, report: path.join(output, 'report.json') }));
});
