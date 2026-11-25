# Verifier evaluation: development set

Run on 2026-11-24T19:41:30.925Z against the live Crossref and OpenAlex APIs.

**33 of 33 references classified correctly (100%).**

| Expected | Correct |
|---|---|
| verified | 14/14 |
| not_found | 8/8 |
| close_match | 5/5 |
| retracted | 6/6 |

## Every reference

| # | Kind | Expected | Got | Reason given |
|---|---|---|---|---|
| 1 | real, no DOI | verified | verified | Title, first author and year match a database record. |
| 2 | real, no DOI | verified | verified | Title, first author and year match a database record. |
| 3 | real, with DOI, print year | verified | verified | Matched by DOI; title, author and year agree. |
| 4 | real, no DOI | verified | verified | Title, first author and year match a database record. |
| 5 | real, with DOI | verified | verified | Matched by DOI; title, author and year agree. |
| 6 | real, conference paper without DOI | verified | verified | Title, first author and year match a database record. |
| 7 | real, classic, no DOI | verified | verified | Title, first author and year match a database record. |
| 8 | real, classic, with DOI | verified | verified | Matched by DOI; title, author and year agree. |
| 9 | real, print year differs by one | verified | verified | Title, first author and year match a database record. |
| 10 | fabricated, fake DOI | not_found | not_found | The DOI 10.1016/j.jadh.2021.03.007 is not registered in Crossref or OpenAlex. |
| 11 | fabricated, plausible journal | not_found | not_found | No matching record in Crossref or OpenAlex. |
| 12 | fabricated, fake DOI | not_found | not_found | The DOI 10.1038/nnr.2020.0145 is not registered in Crossref or OpenAlex. |
| 13 | fabricated, real journal | not_found | not_found | No matching record in Crossref or OpenAlex. |
| 14 | fabricated, real journal | not_found | not_found | No matching record in Crossref or OpenAlex. |
| 15 | fabricated, fake DOI in a real journal | not_found | not_found | The DOI 10.1016/j.adolescence.2018.99.001 is not registered in Crossref or OpenAlex. |
| 16 | fabricated | not_found | not_found | No matching record in Crossref or OpenAlex. |
| 17 | real DOI attached to an invented title | not_found | not_found | The DOI exists but belongs to a different paper: "The association between adolescent well-being and digital technology use". |
| 18 | wrong year (2014 for 2017) | close_match | close_match | Close match: year differs: your reference has 2014, the record has 2017. Confirm this is the paper you mean. |
| 19 | wrong year (2015 for 2019) | close_match | close_match | Close match: year differs: your reference has 2015, the record has 2019. Confirm this is the paper you mean. |
| 20 | wrong year and journal | close_match | close_match | Close match: year differs: your reference has 2012, the record has 2015. Confirm this is the paper you mean. |
| 21 | title partly rewritten | close_match | close_match | Close match: only 67% of the record's title words appear in your reference. Confirm this is the paper you mean. |
| 22 | author order swapped | close_match | close_match | Close match: author order differs: the record lists Keles first, your reference lists McCrae first. Confirm this is the paper you mean. |
| 23 | retracted, with DOI | retracted | retracted | Retracted on 2010-02-06, flagged by Crossref (Retraction Watch data) and OpenAlex. Notice: 10.1016/s0140-6736(10)60175-4. |
| 24 | retracted, no DOI | retracted | retracted | Retracted on 2025-08-07, flagged by Crossref (Retraction Watch data) and OpenAlex. Notice: 10.3389/fpsyg.2025.1675601. |
| 25 | retracted, with DOI | retracted | retracted | Retracted on 2020-06-05, flagged by Crossref (Retraction Watch data) and OpenAlex. Notice: 10.1016/s0140-6736(20)31324-6. |
| 26 | retracted, no DOI | retracted | retracted | Retracted on 2020-06-04, flagged by Crossref (Retraction Watch data) and OpenAlex. Notice: 10.1056/nejmc2021225. |
| 27 | retracted, with DOI | retracted | retracted | Retracted on 2006-01-20, flagged by Crossref (Retraction Watch data) and OpenAlex. Notice: 10.1126/science.1124926. |
| 28 | retracted, no DOI | retracted | retracted | Retracted on 2014-07-02, flagged by Crossref (Retraction Watch data) and OpenAlex. Notice: 10.1038/nature13598. |
| 29 | real, psychology classic | verified | verified | Title, first author and year match a database record. |
| 30 | real, statistics | verified | verified | Matched by DOI; title, author and year agree. |
| 31 | real, open science | verified | verified | Title, first author and year match a database record. |
| 32 | real, medicine | verified | verified | Matched by DOI; title, author and year agree. |
| 33 | real, education | verified | verified | Title, first author and year match a database record. |
