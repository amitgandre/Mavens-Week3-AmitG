# Agent 2 — simple public web and news collector

Open **Agent 2 - Public Web and News** in n8n. Start **Company Research Form**,
enter a company name, and submit. You can enter up to six names separated by
commas or new lines. The workflow uses your existing SerpApi credential.

Four searches run per company: cybersecurity news, leadership changes,
IT/security contracts, and technology adoption. Dates cover three calendar
months in America/Chicago. A retry may consume an extra search credit.

Read **Prepare Evidence Package → Output → JSON**:

- `evidence_records`: dated, in-window snippets with a lexical company match,
  in the five-field format Agent 3 expects (plus provenance/quality metadata).
- `review_queue`: undated, out-of-window, title-only, ambiguous, or conflicting records.
- `coverage` and `failed_searches`: topic coverage and visible research gaps.

Search snippets and titles are not full article text. Publication dates are
search metadata, not independently verified publisher dates. The workflow does
not fetch original pages, automate logins, scan systems, or bypass restrictions.
It never uses an HTTP Request node, and has no GET/POST configuration. The
native search integration handles its own network communication internally.

Agent 1 hands off only an explicitly approved company list. Agent 2 uses local Gemma to suggest extra search terms; Agent 3 remains the
local Gemma evidence extraction stage.
Usable excerpts are now sent to Agent 3 one at a time; `review_queue` is never
sent automatically. Open **Research and Signals** for the combined output.
Empty or partial results are valid and reported honestly. See
[the connection instructions](../agent3/README.md).

The separate **Agent 2 - Live Search Test** workflow researches PepsiCo and
consumes four searches per run. Pure edge-case tests run with:

```sh
node n8n/agent2/test_collector.cjs
```

Source: `build_agent2.py` prepares the native visual workflow and guarded Agent 1
integration. `collector.js` contains deterministic collection/quality checks.


### Local AI headline enhancement

Agent 2 now makes one local Ollama planning call per run and adds at most one
search per company to the four core searches. If planning fails or produces no
valid query, the core searches still run. Up to six companies means up to 30
initial search requests; retries can consume additional existing SerpApi quota.
There is no new cloud AI account or model fee.

Open **Research and Signals** after running Agent 2. `headline_markdown` contains
clickable headlines; `headlines` contains title, publisher, date and original
source URL. Titles and URLs come from actual search results, never the model.
The feed favors different source domains, excludes job ads, and separates
undated candidates in `undated_headlines`. Dates are search metadata rather
than independently verified article dates. Agent 3 receives usable excerpts
through the existing connection. No HTTP Request nodes were added.

`enhance_headlines.py` upgrades an exported current workflow without rebuilding
its existing Agent 3 handoff. `ai_headlines.js` contains the query guards and
headline selection. Run `node n8n/agent2/test_ai_headlines.cjs` for local checks.
