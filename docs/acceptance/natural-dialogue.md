# T221 — Learner-led payment and less repetitive dialogue

## Implementation
- Check spoken Vietnamese before release: unsolicited payment questions, identical recent questions, and quantity/spice/dining questions already answered in the current message or submitted values trigger the existing single bounded regeneration. Generic repeated closers and mixed-script checks remain.
- Give the model the specific issue when regenerating. Preserve agreed facts and rule-based address terms; prefer a short concrete statement over an administrative acknowledgement or mandatory closing question.
- Apply conversation checks to generated fields before rendering. Unrequested payment and repeated/already-answered UI questions use the existing single schema/language repair. A legitimate request about payment methods can still generate payment UI. Explicit repeat/change requests remain supported.
- Different alternatives under the same field label are not automatically a repeated question. UI summaries are not treated as new questions. Submitted metadata questions/options are not learner answers.
- No deterministic dialogue template, new registry type, dependency, secret read/write or cultural rule.

## Limits
These are bounded text checks, not a general semantic evaluator. Exact questions are compared against the last three assistant turns; paraphrases outside the recognized topics may pass. The answered-topic checks cover explicit quantities, spice and dining mode in the current input, not every possible detail in arbitrary earlier text. Payment request detection supports common Vietnamese/English wording. The full multi-item accounting limitations from T220 remain.

## Validation
- Full final suite: **199/199**; LLM suite: **73/73**.
- Typecheck/lint/build passed during implementation; final E2E and live results recorded below.
- Unit/integration cases cover payment vs tea/total/cash preference, explicit payment request, changed alternatives, repeat request, answered fields from UI values, bounded regeneration and no commit after repeated quality failure.

## Live/E2E
Groq `openai/gpt-oss-120b`, fallback disabled, browser → Host → Facade; health `llm`, `dev=false`. `test-results/t221-live/report.json`: **passed**, 13 checked assistant replies (opening, generated choice, submission and 10 followups), no manual Retry or visible error. No mock/interception. Facade logged one automatic bounded dialogue-quality regeneration; the accepted reply, not the rejected draft, was displayed.

- One serving / not spicy / eat here: acknowledged without repeating these questions.
- Herbs and iced tea: continued the order without a payment question.
- Total: “Tổng cộng 70.000 đồng.” No payment question or form appended.
- Napkins and onions: answered the topic, without returning to checkout.
- Learner explicitly asks how to pay: “Bạn có thể trả tiền mặt hoặc dùng thẻ.”
- Cash selection: “Tiền mặt nhé, cảm ơn bạn!” No repeated method question.
- Final thanks: ended the conversation without another question.
- Model-generated dish UI remained interactive; descriptions were English. Images: `generated-ui.png`, `after-interaction.png`, `long-conversation.png` in the same evidence directory.

This run demonstrates improvement, not universal naturalness: the closing “Rất vui được phục vụ” is still somewhat formulaic. The 70,000 VND was a fictional model quote, not independently verified multi-item accounting. The final narrow false-positive refinements (whole-word payment detection and allowing different alternatives with the same label) were unit-tested after the live process started; do not claim this run exercised those branches.

Final E2E: **28/28 passed (47.5s)**, `test-results/t221-e2e.log`. No commit/push/PR. All started live servers stopped after verification.
