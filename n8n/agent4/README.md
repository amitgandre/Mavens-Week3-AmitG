# Agent 4 — Public leadership background

Uses local Ollama Gemma and the existing native Google/SerpApi integration. No HTTP Request nodes and no new cloud AI account.

## Run visually

1. Open **Agent 4 - Public Leadership Background** in n8n.
2. Click **Execute workflow**. Open the form when n8n starts listening.
3. Enter a company name, such as PepsiCo, and submit.
4. Wait for **Saved Leadership Briefing** to complete.
5. Open that node's **Output → JSON → background_markdown** for readable results. `roles` shows CEO/CISO/CTO/CIO candidates or missing/conflicting roles. `profiles` contains supporting professional background claims and source links.

Current low-credit mode uses two combined discovery searches for CEO, CISO, CTO and CIO, followed by one public LinkedIn search for each distinct supported leader (maximum four). This means at most six initial searches/company, with automatic search retries disabled. Missing roles and background fields remain explicit; the reduced query plan limits coverage of prior-firm employment and education. No substitute names or inferred titles are filled in.

The workflow supports an internal **From Orchestrator** sub-workflow trigger with `{ "company_name": "Target" }`. The current orchestrator recalls matching saved leadership profiles and automatically researches companies without a complete/partial profile saved in the last seven days. Dated profiles and caveats are included in the PowerPoint.

## Evidence and scope

Only public professional search excerpts are used. People/contact lookup services and private URLs are excluded. Source quotation, name/company context and relationship checks run after model extraction. A client relationship does not establish firm employment; speaking, sponsorship or fandom does not establish school attendance. Former leaders are not accepted as current-role candidates. Conflicting names are shown without silently selecting one.

All accepted claims are **snippet-supported leads requiring original-source verification**. The workflow does not retrieve full articles, establish verified current appointments, infer personal relationships, or infer sports participation. Background can predate the three-month news window. `not found` means insufficient supplied evidence.

Education is matched against an explicit 16-school SEC list dated October 25, 2026. This uses current membership, not conference membership at attendance. References: [SEC official member institutions](https://www.secsports.com/?TabName=Member+Institutions), [official SEC season notes hosted by Alabama](https://rolltide.com/documents/download/2026/3/6/SEC_Game_Notes__3-7-26_.pdf). Refresh the roster if membership changes. Ambiguous abbreviations such as USC are not mapped to a school.

## Retention and build

The native **Retain Leader Background** Data Table node appends a `leadership_background` row to **Week3 Research Memory** for each run. Old runs are retained. Test runs use a separate `leadership_background_test` record type and are excluded from production briefings.

`build_agent4.py` builds Agent 4 using current credential references from an exported workflow file. `connect_orchestrator.py` adds saved-background recall and refreshes the briefing/PPT logic without changing the peer-approval requirement. Raw backups keep existing references locally; portable exports omit them.

Checks:

```sh
node n8n/agent4/test_background.cjs
node n8n/agent4/test_linkedin.cjs
node n8n/agent4/test_briefing.cjs
```

## Validation recorded October 25, 2026

Live native search and local Gemma stages were exercised with PepsiCo. Final cached regression processed the recorded outputs through the final guards and native memory without more search quota. Result: CEO candidate needs verification; CISO evidence disputed; CTO sources conflict; company-wide CIO not found. Two people researched, five snippet-supported background claims, zero background model errors. One upstream education-search failure remained explicit and the overall result was partial. These are test outcomes, not verified statements of current leadership.

Deterministic checks cover exact references/quotes, former/future/regional roles, employment versus client/award relationships, education versus fandom/speaking/honorary degrees, and separate campuses. PowerPoint tests cover citations, latest matching profiles, and exclusion of test/other-company records. Test memory records are separate; run the production form to save a real profile for a new briefing.


### Public LinkedIn search enhancement
One dedicated `site:linkedin.com/in/ "Person name" "Company name"` query runs per discovered leader using the existing native Google node. `profiles[].linkedin_profiles` contains matched profile links, and `background_markdown` lists them. Only actual LinkedIn `/in/` URLs are accepted; lookalike domains, posts, and uncertain identity matches are excluded or held for review. No LinkedIn login or profile-page retrieval occurs. Indexed snippets may be incomplete or outdated; the workflow labels them as needing profile verification. Failures remain visible without inventing details. Existing search quota applies.
