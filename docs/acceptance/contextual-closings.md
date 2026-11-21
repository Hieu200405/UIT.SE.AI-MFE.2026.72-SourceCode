# T222 — Contextual endings across roles

## Change
- Corporate closing phrases (e.g. “Rất vui được phục vụ”, gratitude for trust/choosing a service, promises to always be available) trigger one bounded model rewrite before display. No canned replacement text is inserted.
- Explicit departures at the end of a learner message prevent a new spoken question or interactive form. A simple thank-you followed by another request remains an ongoing conversation. Explicit repeat requests remain supported.
- Prompt describes a different conversational purpose for neighbours, landlords and sellers, without changing rule-based pronouns or adding cultural rules. It forbids invented next steps, appointments and transactions.
- All checks use the existing limiter/budget/recovery paths. No new dependency, registry type or secret read/write.

## Limits
Phrase/departure detection is deliberately narrow, not a semantic naturalness score. Other formulaic phrases and paraphrases may pass. A polite closing or thank-you is not itself an error. This task does not certify the underlying draft scenario content or factual claims made in practice conversations.

## Validation
- npm test: **203/203** including the incomplete-farewell regression (LLM **77/77**). Build, lint and typecheck completed successfully.
- Regressions distinguish corporate vs ordinary closings, a goodbye vs a thank-you plus question, no new UI after goodbye, and model regeneration before bad text/translation is displayed.
- Browser script: `scripts/verify-live-scenarios.cjs`. Three isolated browser contexts, real Host/Facade/Groq, sequential requests, no interception or fixture. Models may choose text only; UI is submitted if offered, with at least one form required across the run. Saves DOM dialogue, visible explanatory UI and screenshots; no manual Retry.

## Live/E2E
Closing/UI gates have now been checked in all three scenarios across the runs below; this is not blanket semantic acceptance. Final E2E **28/28 passed (41.5s)**, `test-results/t222-e2e.log`.

- `test-results/t222-live`: first renting attempt failed with `invalid_ui` after bounded repair; no completed-turn commit. The original schema/language reason was not logged, so the root cause cannot be inferred from that run. Added safe reason codes to the existing UI repair and included the reason in repair instructions; no raw payload or credentials logged.
- `test-results/t222-live-final`: renting UI and submission worked, but the closing “Cháu nhé, hẹn gặp chiều mai” was an incomplete phrase. Stopped this run while market was in progress; its running status is not acceptance. Added a farewell-only check for bare address term + nhé and an explicit complete-phrase rewrite instruction. Mid-conversation acknowledgements and ordinary goodbyes remain valid.
- `test-results/t222-live-verified`: renting passed with a submitted generated form and six assistant replies. The overall run failed at the opening of market with a rate-limit message (6-second wait), so it is not a three-scenario pass.
- Continuation on 2026-11-21: `test-results/t222-live-remaining`, market + neighbours only. Harness now supports explicit scenario selection and a pause between scenarios; request pacing increased to 30 seconds. Renting is not needlessly replayed. Continuation **passed** the automated gates: market 6 assistant replies with one submitted UI, neighbours 5 replies (text-only). No manual Retry or visible error in this continuation. One bounded automatic dialogue-quality recovery was logged.


## Final live observations (2026-11-21)
Provider: Groq `openai/gpt-oss-120b`, Facade `mode=llm`, `dev=false`, fallback disabled. Evidence totals: **17 assistant replies**, **2 generated form submissions**, three scenarios in separate browser contexts across two reports. The `t222-live-verified` report is failed overall due to market opening rate limiting; only its individually passed renting case is used here. The market/neighbours continuation is `t222-live-remaining/report.json` (passed).

| Scenario | Observed closing | Closing gate |
| --- | --- | --- |
| Renting | “Cháu, hẹn gặp chiều mai 14h. Tạm biệt nhé.” | No corporate phrase, new question or form |
| Market | “Cháu ạ, hẹn gặp lại lần tới nhé.” | No corporate phrase, new question or form |
| Neighbours | “Cháu về an toàn nhé, hẹn gặp lại lần sau!” | No corporate phrase, new question or form |

The images `renting-conversation.png`/`renting-ui.png` in `t222-live-verified` and `market-conversation.png`/`market-ui.png`/`neighbors-conversation.png` in `t222-live-remaining` retain the visible evidence. Generated market UI explanations were English; Vietnamese fruit names were preserved. Text-only neighbour replies were accepted rather than forcing a form.

### Manual review: not resolved by these closing gates
- Market changed the learner's **one kilogram** into **one fruit**, and introduced a **5,000 VND bag charge**, then a 35,000 VND total. These are substantive order/price errors. Do not label the market conversation semantically correct just because the closing check passed.
- Some phrases remain awkward or literal: “ăn trái gì nhẹ nhàng”, “Xem xét xoài hay cam”, and the address-only lead-in “Cháu ạ”.
- Neighbour wording “cô cũng thường đi bộ cùng cháu” suggests shared prior activity that had not been established; it needs better grounding in the current conversation.
- The checks are bounded and do not establish universal naturalness, address correctness or factual accuracy. Draft culture/scenario content is not promoted to verified.

No commit/push/PR. Live servers started for this verification were stopped after the run.
