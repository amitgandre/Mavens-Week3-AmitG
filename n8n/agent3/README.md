# Agent 2 → Agent 3

Run Agent 2's company form as before. After collection, only `evidence_records`
are split into individual excerpts and passed to **Cybersecurity Signals** through
a native Execute Sub-workflow node. `review_queue` is never sent automatically.

Local `gemma4:12b` analyzes one excerpt at a time. This adds model-processing time
but no new search calls. Source IDs, URLs, quotations and job-ad conclusions are
checked before signals are accepted. Unsupported signals remain in
`rejected_signals`; excerpts with no supported signals return an empty list.

In Agent 2, open **Research and Signals → Output → JSON** for the combined
collection and `analysis_results`. No usable excerpts means no model calls.
Search snippets remain preliminary evidence, not verified full articles.

The separate **Agents 2 to 3 - Connection Test** workflow reuses one recorded
public job-ad excerpt plus the four-signal synthetic example and calls local
Gemma. It makes no search requests.

Agent 3 is published for internal sub-workflow calls, as required by this n8n
version. It has no public form or webhook trigger. If reimporting Agent 3,
publish its updated version before calling it from Agent 2.

Agent 3's original manual synthetic test is retained. Its test date was left at
January 1 as a negative date-filter test; external Agent 2 inputs use their own
passed research-window dates.

Run `node n8n/agent3/test_validations.cjs` for deterministic guard tests.


Company attribution is now required in non-job quotations. Generic recommendations, unsupported deployment statuses and unstated "not disclosed" values are rejected. Local model replay: nine excerpts, three supported signals, zero failures. See ATTRIBUTION_TEST_RESULTS.json. Upgrade current Agent 3 using tighten_agent3.py, then publish the new version.
