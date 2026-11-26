# Skeptic evaluation: live run

Run 2026-11-25T18:29:36.293Z with nvidia/nemotron-3-ultra-550b-a55b, through the full pipeline (AI verdict, then code's evidence rules).

> Development result: the model setup was chosen by comparing four NVIDIA-hosted setups on this same set (eval/skeptic-model-comparison.md). The prompt and the evidence rules were not changed after seeing the results.

- Correct verdicts: **19 of 20**
- Left Unchecked (code's evidence rules, or a failed AI reply): 1
- Claims wrongly labelled Supported: **0** (the error that matters most)
- Average time per check: 3.9 s

| Id | Kind | Expected | Got | Evidence | Hints | Time |
|---|---|---|---|---|---|---|
| T1 | paraphrase | supported | supported | 1 | none | 4.0 s |
| T2 | causal | overreach | overreach | 2 | causal | 6.1 s |
| T3 | negation | not_supported | not_supported | 4 | polarity | 2.6 s |
| T4 | certainty | overreach | overreach | 3 | certainty | 4.3 s |
| T5 | different_finding | not_supported | not_supported | - | none | 3.6 s |
| R1 | paraphrase | supported | supported | 10 | none | 4.3 s |
| R2 | magnitude | overreach | overreach | 10 | magnitude | 4.5 s |
| R3 | different_finding | not_supported | not_supported | 9 | none | 4.0 s |
| R4 | population | overreach | overreach | 11 | population | 4.5 s |
| R5 | generalisation | overreach | overreach | 11 | generalisation | 5.5 s |
| K1 | paraphrase | supported | supported | 7 | none | 1.7 s |
| K2 | causal | overreach | overreach | 1 | causal | 6.2 s |
| K3 | opposite_direction | not_supported | not_supported | 5 | none | 3.0 s |
| K4 | number | supported | supported | 6 | none | 2.2 s |
| Ke1 | paraphrase | supported | supported | 5 | none | 2.8 s |
| Ke2 | certainty | overreach | unchecked (evidence_not_relevant) | - | certainty | 4.6 s |
| Ke3 | different_finding | not_supported | not_supported | 3 | none | 4.6 s |
| P1 | paraphrase | supported | supported | 2 | none | 3.2 s |
| P2 | negation | not_supported | not_supported | 4 | polarity | 2.8 s |
| P3 | generalisation | overreach | overreach | 4 | generalisation | 3.2 s |

A small set (20 claims on 5 abstracts). Early evidence, not a guarantee.
