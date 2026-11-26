# Choosing the AI model (25 Nov 2026)

The original model, `meta/llama-3.3-70b-instruct`, reached end of life on NVIDIA on 26 Aug 2026 (the API answers HTTP 410). Llama 3.1 70B, Llama 4 Maverick and Nemotron Super 49B were retired too. We measured the NVIDIA-hosted replacements on the 20 labelled claims in `skeptic-set.json`, through the full pipeline (the app's prompt, then code's evidence rules), one setup at a time.

| Setup | Correct | Wrongly "Supported" | Left Unchecked | Time per check | Notes |
|---|---|---|---|---|---|
| **`nvidia/nemotron-3-ultra-550b-a55b`, thinking off** | **17/20** | **0** | 3 | **~4 s** | Chosen. Two correct "overreach" verdicts were refused by code's evidence rule (their sentence shared too few terms with the claim); one reply timed out at 30 s |
| `nvidia/nemotron-3.5-lightning-30b-a3b`, thinking on (6x token budget) | 12/20 | 0 | 8 | ~21 s | Every answered claim was right, but it sometimes reasoned past 8,000 tokens without answering |
| `nvidia/nemotron-3.5-lightning-30b-a3b`, thinking off | 10/20 | 0 | 3 | ~2 s | Fast, but labelled most claims "overreach", including correct paraphrases |
| `stepfun-ai/step-5-preview` (6x token budget) | 7/20 | 0 | 13 | ~33 s | Most replies timed out at 40 s |
| `mistralai/mistral-large-4-1t-a52b` | – | – | – | over 60 s | Every probe timed out |
| `google/gemma-3-12b-it` | – | – | – | – | "Not found for account" for our key |
| `z-ai/glm-5.3-flash`, `moonshotai/kimi-k3.1-pro`, `minimaxai/minimax-m3.1-flash` | – | – | – | – | Probed once: 80 s, an error, and HTTP 503 |

No setup ever labelled an unsupported or overreaching claim "Supported": the evidence rules and the conservative fallback (Unchecked) held for every model.

**Published run.** With the chosen setup as the app's default (and the AI timeout raised from 30 s to 40 s), the published run scored **19/20**, with none wrongly Supported, one claim left Unchecked by the evidence rule, and 3.9 s per check (`skeptic-RESULTS.md`). The comparison run of the same setup scored 17/20: hosted models do not answer identically every time, so expect results in that range.

**Caveat:** the model was picked on this same set, so its score is a development result, not a held-out one. The Skeptic's prompt and code's evidence rules were not changed after seeing these results. Re-run `npm run eval:skeptic -- live <url>` after any model change.
