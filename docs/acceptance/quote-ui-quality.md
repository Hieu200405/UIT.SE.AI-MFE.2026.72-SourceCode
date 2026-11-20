# T220 — Price continuity and English UI

## Change
- Preserve older explicit VND quotes in bounded conversation context; quotes remain assistant history, never system instructions. The prompt distinguishes selected items, quantity, unit price and subtotal and forbids adding an unaccepted fee.
- A narrow pre-display guard rejects a changed amount when a total-only question immediately follows a single quote. An extra with a different earlier price and evidence of multiple servings are excluded unless the previous quote explicitly states a total. It shares the one dialogue recovery with existing quality/network recovery; a second failure produces an error without committing the turn.
- Validate English explanatory UI text before rendering. Vietnamese diacritics in descriptions, badges and comparison facts trigger the existing one schema/language repair through the same provider, limiter and budget. Exact current/prior option names remain allowed. An unsuccessful repair does not commit the form.
- The model still chooses whether to generate UI and which registered layout to use.

## Scope and limitations
This is language practice, not a checkout ledger. The deterministic price guard does not compute arbitrary multi-item orders, parse written-out numbers, or enforce every currency. Multi-item arithmetic still depends on model reasoning and is verified in the live scenario below. The language guard is a conservative Vietnamese-diacritic check, not a general English detector; unaccented Vietnamese may pass, and borrowed accented words can trigger repair. Summary values and selectable practice phrases remain learner content. Do not treat these checks as a guarantee of all possible dialogues.

## Validation
- Full npm test passed: 192/192. After the final guard refinement allowing a known price breakdown, the LLM suite was rerun: 66/66.
- Build, lint and typecheck passed.
- Added regressions: VND formatting, changed total rewrite/no leak, repeated price failure/no commit, old quote memory, English description repair preserving options, repeated invalid UI/no commit, comparison facts.
- Real Groq web: passed; see evidence below. Final E2E rerun on 2026-11-20: **28/28 passed (1.1m)**, `test-results/t220-e2e-final.log`. The earlier process was interrupted after 20 completed cases and was not counted as a pass.

## Live attempts
- First attempt: `test-results/t220-live/report.json` failed the older comparison-layout assertion. Screenshot shows valid English rich cards; no provider error. This assertion was too specific for model-chosen layout in the price/language test. The dedicated comparison test still requires comparison; the quote-check mode accepts other valid forms.

- Second attempt: `test-results/t220-live-final/report.json` verified totals 55,000 and 100,000 VND and completed all six followups. Final language check failed on mojibake in Chromium-captured SSE (e.g. a non-breaking hyphen became `â€‘`), whereas screenshots/DOM showed English. Subsequent script checks visible explanatory DOM on every turn; raw SSE is retained only as diagnostic evidence.
- Outstanding observed dialogue issue: unsolicited/repeated payment questions and a redundant quantity question remain. These are not counted as resolved by T220.


## Real Groq browser result
`test-results/t220-live-dom/report.json`: **passed**, health `mode=llm`, `dev=false`; runtime provider Groq `openai/gpt-oss-120b`, fallback disabled. No mock routing and no manual Retry. The agent generated dish choices, accepted a real form submission and completed six followups.

- One selected dish at 45,000 VND + one iced tea at 10,000 VND: asked total **55,000 VND**.
- Changed to two dishes, retaining one tea: **100,000 VND**, still **100,000 VND** when asked again.
- Cash choice: “Tiền mặt nhé.”
- Visible UI explanations checked from DOM were English, including “Soft noodles, clear broth, fresh herbs on the side” and “Crispy baguette, soft interior, ready to eat”. Vietnamese dish names/options were retained.
- Evidence: `generated-ui.png`, `comparison-mobile.png`, `after-interaction.png`, `long-conversation.png` in the same directory. Layout was model-selected rich cards; the preceding run separately generated comparison facts in English.
- The final false-positive exclusions (extra/unit prices and a breakdown made of known prices) were unit-tested after this live process started. Do not interpret this live evidence as testing every new guard branch or every possible order.

Known remaining issue: this successful run still introduced a payment question without being asked; the preceding run repeated it. Fixing all dialogue repetition remains separate from the price/language acceptance here. No new dependency, registry type, secret access or cultural rule. No commit/push/PR performed.
