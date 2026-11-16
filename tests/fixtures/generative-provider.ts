// TEST ONLY. Simulates provider output through the real Facade/stream/parser path.
// No production module imports this fixture.
import { readFileSync } from 'node:fs';
import { createFacade } from '../../packages/ai-service-facade/src/server.ts';
import { loadRules } from '../../packages/rules-xung-ho/src/load-node.ts';

const form = (title: string, description: string, fields: unknown[]) => ({ title, description, submitLabel: 'Continue', fields });
const dish = form('What would you like to order?', 'Choose a dish for our conversation.', [
  { id: 'meal', label: 'Dish', kind: 'choice', required: true, options: ['Phở', 'Bún'] },
  { id: 'preference', label: 'Anything else?', kind: 'text', required: false },
]);
const spice = form('How spicy?', 'Let’s adapt the order to your preference.', [
  { id: 'heat', label: 'Spice level', kind: 'select', required: true, options: ['Not spicy', 'A little spicy'] },
  { id: 'phrase', label: 'Try saying your order', kind: 'textarea', required: false },
]);
const room = form('What matters in your room?', 'Tell me what you need before we practice asking the landlord.', [
  { id: 'priority', label: 'Your priority', kind: 'choice', required: true, options: ['Quiet', 'Near transport'] },
]);
const text = (vi: string, en: string, ui: unknown = null) => `<vi>${vi}</vi><en>${en}</en><ui>${JSON.stringify(ui)}</ui>`;
const scenarios = JSON.parse(readFileSync(new URL('../../packages/ai-service-facade/data/scenarios.json', import.meta.url), 'utf8')).scenarios;
const server = createFacade({ scenarios, rules: loadRules(), delayScale: 0, engine: {
  llm: { baseUrl: 'https://fixture.invalid', model: 'fixture', apiKey: 'fixture-only' },
  fetchImpl: async (_url, init) => {
    const messages = JSON.parse(String(init?.body)).messages;
    const latest: string = messages.at(-1).content;
    let output = text('Chào bạn, bạn muốn luyện gì?', 'Hello, what would you like to practice?');
    if (latest.startsWith('{')) {
      const response = JSON.parse(latest);
      const meal = response.answers.find((a: any) => a.field === 'meal')?.value;
      output = meal ? text(`Bạn chọn ${meal}. Bạn muốn ăn cay không?`, `You chose ${meal}. Would you like it spicy?`, spice)
        : text('Được rồi, mình tiếp tục nhé.', 'All right, let’s continue.');
    } else if (latest.toLowerCase().includes('noodles')) output = text('Bạn muốn ăn món nào?', 'Which dish would you like?', dish);
    else if (latest.toLowerCase().includes('room')) output = text('Bạn cần phòng như thế nào?', 'What kind of room do you need?', room);
    else if (latest === 'invalid ui') output = '<vi>Bạn có thể trả lời ở đây.</vi><en>You can answer here.</en><ui>{broken}</ui>';
    const slow = latest === 'slow noodles';
    return new Response(new ReadableStream({
      async start(controller) {
        for (let i = 0; i < output.length; i += 40) {
          if (init?.signal?.aborted) { controller.close(); return; }
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ choices: [{ delta: { content: output.slice(i, i + 40) } }] })}\n\n`));
          await new Promise((resolve) => setTimeout(resolve, slow ? 400 : 2));
        }
        controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); controller.close();
      },
    }), { headers: { 'content-type': 'text/event-stream' } });
  },
} });
server.listen(4002, '127.0.0.1');
