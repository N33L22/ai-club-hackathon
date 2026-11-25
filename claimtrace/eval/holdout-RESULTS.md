# Verifier evaluation: held-out set

Run on 2026-11-24T19:41:43.160Z against the live Crossref and OpenAlex APIs.

**13 of 13 references classified correctly (100%).**

| Expected | Correct |
|---|---|
| verified | 5/5 |
| not_found | 4/4 |
| close_match | 2/2 |
| retracted | 2/2 |

## Every reference

| # | Kind | Expected | Got | Reason given |
|---|---|---|---|---|
| 1 | real, classic | verified | verified | Title, first author and year match a database record. |
| 2 | real, classic | verified | verified | Title, first author and year match a database record. |
| 3 | real | verified | verified | Title, first author and year match a database record. |
| 4 | real, conference paper | verified | verified | Title, first author and year match a database record. |
| 5 | real | verified | verified | Title, first author and year match a database record. |
| 6 | fabricated, real journal | not_found | not_found | No matching record in Crossref or OpenAlex. |
| 7 | fabricated, real journal | not_found | not_found | No matching record in Crossref or OpenAlex. |
| 8 | fabricated, fake DOI | not_found | not_found | The DOI 10.1038/s41562-024-99999-x is not registered in Crossref or OpenAlex. |
| 9 | fabricated | not_found | not_found | No matching record in Crossref or OpenAlex. |
| 10 | wrong year (1957 for 1954) | close_match | close_match | Close match: year differs: your reference has 1957, the record has 1954. Confirm this is the paper you mean. |
| 11 | title partly wrong | close_match | close_match | Close match: only 60% of the record's title words appear in your reference. Confirm this is the paper you mean. |
| 12 | retracted, no DOI | retracted | retracted | Retracted on 2011-12-02, flagged by Crossref (Retraction Watch data) and OpenAlex. Notice: 10.1126/science.334.6060.1202-a. |
| 13 | retracted, no DOI | retracted | retracted | Retracted on 2003-03-06, flagged by Crossref (Retraction Watch data) and OpenAlex. Notice: 10.1038/nature01464. |
