# Skeptic evaluation: code hints only

Run 2026-11-25T16:38:57.207Z. No AI involved: these are the code rules that flag risky wording for the Skeptic and the student. They are hints, never verdicts.

> Development numbers: after the first run (7 of 8), the generalisation rule was changed to read the whole source for the sample description, which fixed R5. The live Skeptic run has not seen this set.

- Overreaching claims with at least one overreach hint: **8 of 8**
- Unsupported claims with a hint (direction or overreach): 2 of 6
- Supported claims with a hint (false alarms): 0 of 6

| Id | Kind | Expected | Hints |
|---|---|---|---|
| T1 | paraphrase | supported | none |
| T2 | causal | overreach | causal |
| T3 | negation | not_supported | polarity |
| T4 | certainty | overreach | certainty |
| T5 | different_finding | not_supported | none |
| R1 | paraphrase | supported | none |
| R2 | magnitude | overreach | magnitude |
| R3 | different_finding | not_supported | none |
| R4 | population | overreach | population |
| R5 | generalisation | overreach | generalisation |
| K1 | paraphrase | supported | none |
| K2 | causal | overreach | causal |
| K3 | opposite_direction | not_supported | none |
| K4 | number | supported | none |
| Ke1 | paraphrase | supported | none |
| Ke2 | certainty | overreach | certainty |
| Ke3 | different_finding | not_supported | none |
| P1 | paraphrase | supported | none |
| P2 | negation | not_supported | polarity |
| P3 | generalisation | overreach | generalisation |

The verdict accuracy of the Skeptic itself needs a live AI run: `npx tsx scripts/eval-skeptic.mts live <baseUrl>`.
