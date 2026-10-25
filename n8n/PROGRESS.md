# Build checkpoint — October 24, 2026

User preference: keep saving work. Refresh a versioned local n8n workflow backup
after completed build stages during this conversation. These are checkpoints,
not an unattended scheduled backup service. Export saved workflow definitions;
browser edits must first be saved in n8n. Do not export credential secrets.

Backup: `backups/workflows-2026-10-24-checkpoint-01.json`.
Contains saved workflow definitions, not credential secrets or a full database backup.

Latest backup: `backups/workflows-2026-10-24-checkpoint-02.json`.
Verified saved Research Orchestrator connections: On form submission → Research
Settings → Google search (`n8n-nodes-serpapi.serpApi`). User confirmed results.
Search provider changed to SerpApi free tier; Tavily is no longer required.
Next: visually connect a local Ollama Basic LLM Chain to extract supported target
revenue evidence. Search snippets alone are preliminary evidence; full official
sources must be verified before final revenue ranking.

Checkpoint 03: `backups/workflows-2026-10-24-checkpoint-03.json` includes
Extract Revenue Evidence and local gemma4:12b. Direct read-only execution audit:
execution 17 submitted company `a`, producing unrelated PEERS results. Execution
19 submitted `PepsiCo`, rendered the correct annual-revenue query, retrieved
PepsiCo annual-report titles, and completed successfully. No pinned data present
in the saved workflow. Earlier incorrect input is resolved in the latest run.

Checkpoint 04 preserves the parser configuration before fixing its failure.
Execution 21 failed with Invalid JSON in model output: commentary preceded JSON.
Saved node is legacy Ollama Model (`lmOllama`), not Ollama Chat Model. Inspected
installed node source: Chat Model supports Options → Output Format → JSON.
Next visual fix: replace legacy model with Ollama Chat Model, retain gemma4:12b
and credential, select JSON output, keep Structured Output Parser, rerun chain.

Latest backup: `backups/workflows-2026-10-24-checkpoint-05.json` (4 workflows,
JSON verified). Research Orchestrator now uses Ollama Chat Model with gemma4:12b.
Its saved options are empty: Output Format → JSON has not yet been saved.
Next: user sets that option and reruns extraction; successful parser execution
has not yet been verified.

Checkpoint 06: verified backup of 5 workflows, including `Cybersecurity Signals`.
Its saved Test Evidence source_url is https://example.com/synthetic-test.
User reports Agent 1 complete (full peer-discovery functionality not independently
verified). Agent 3 synthetic test returns four signals and user confirms corrected
source URLs/company key. Next: add deterministic publication-date filter before
extraction; preserve separate effective dates and exclude unknown dates for review.

Checkpoint 07: saved date filter uses dateTime afterOrEquals/beforeOrEquals.
Executed actual Agent 3 via n8n CLI successfully: 1 item passed the filter,
0 discarded; local Gemma and parser succeeded in about 49 seconds, returning
all four expected synthetic signals with synthetic URL preserved. Input field
is still `Company` while prompt expects `company`; normalize before live integration.

Checkpoint 08: reviewed Research Orchestrator directly. Execution 33 successfully
extracted PepsiCo annual revenue 93,925 USD millions, fiscal year 2025, from the
uploaded PDF; still marked pdf_extracted_unverified. Current branches are form →
PDF extraction → revenue chain and form → Research Settings → Google search.
Search branch ends there; peer discovery, candidate revenue collection, comparison,
and human approval are not built. Next visual step: repurpose Google search as
Find Peer Candidates using target company, sector, and geography from the form.

Latest checkpoint: `backups/workflows-2026-10-24-checkpoint-09.json`.
Verified JSON export of all 4 currently saved workflows; older checkpoints retained.
Research Orchestrator now includes Find Peer Candidates → Extract Peer Candidates
(local model/parser nodes present) and a Split Out node. User reported candidates:
Coca-Cola, Heineken, Nestlé, Monster Beverage. These are unverified candidates,
not the final five revenue peers. Need verify Split Out outputs four company items,
then collect sourced comparable annual revenues, normalize and rank; widen candidate
discovery if fewer than five qualify. Agent 3 synthetic workflow remains backed up.

Direct Split Out test using installed n8n node implementation and execution 46
fixture: saved path `output.candidates[1]` splits the second company's four object
properties into four malformed items. Corrected path `output.candidates` returns
8 proper company items, matching all 8 candidates in that recorded execution.
Correction was tested in isolation, not applied to the live workflow. User should
change Fields To Split Out to the complete array path (no [1]) and rerun.
The full form workflow was not rerun, and no new search credits were consumed.

Checkpoint 10: freshly exported live workflow already has the corrected path
`output.candidates` when user requested application. No live import needed.
Backed up all 4 workflows to workflows-2026-10-24-checkpoint-10.json.

Retested checkpoint 10 Split Out configuration against execution 46 using the
installed Split Out node: PASS, expected 8 and returned 8 items, each with company
and source_url strings. No new searches or live workflow mutations. Next build:
candidate revenue collection, source verification, currency/period normalization,
and closest-five ranking with human review.

Checkpoint 11: applied Find Candidate Revenue node to live Research Orchestrator
via supported workflow import. Cloned existing SerpApi Google Search node and
credential reference, connected Split Out → Find Candidate Revenue. Query uses
each item's `$json.company` plus latest full-year consolidated revenue terms.
Re-exported and verified node, expression, credential reference, and connection.
No new searches executed. Refresh editor before working on updated workflow.

Checkpoint 12: user could not see Find Candidate Revenue; fresh export confirmed
it had disappeared (possibly overwritten by a stale editor save). Restored it on
top of latest saved workflow, re-exported, verified node/connection, and backed up
all 4 workflows. User must reload editor before editing to load external changes.

## Agent 1 completion — checkpoint 13

Completed and applied 37-node Research Orchestrator in existing workflow
2H45pUuwyaVZc99j. Visual native SerpApi nodes, local gemma4:12b chat models,
structured parsers, deterministic Code nodes, IF/Split Out, and form approval.
No HTTP Request nodes. Features: input validation; optional PDF or target-search
baseline; bounded peer discovery; per-company revenue extraction; traceable
quotations and source checks; units/currency/year/sector checks; annual-average
FX search with strict direction validation; nearest-five ranking within criteria;
shortfall/exclusion reporting; explicit source/shortfall approval; blocked handoff
unless approved. Refresh browser before editing the externally updated workflow.

Tests: pure validation/ranking and approval tests passed. Live n8n integration
execution 50 used recorded PDF/discovery and actual local Gemma, five candidate
revenue searches and one FX search. It exposed an ambiguous FX table value;
validation was tightened to require explicit currency direction and annual year.
Final cached regression through actual n8n nodes passed: target USD 93,925 million
FY2025, 5 candidates, 1 qualifying candidate (Coca-Cola), shortfall 4. Nestlé held
for FX evidence, Monster/Keurig below default size band, FEMSA missing revenue.
Synthetic approval execution 51 rendered a real local form and a Reject submission
produced rejected status with zero downstream companies. No real research approved.

Saved checkpoint 13 exports all 7 workflows, including separate integration,
cached-regression, and synthetic review-gate tests. Original four-workflow snapshot
also saved as before-agent1-completion. Saved graph re-exported and compared exactly
against tested build. See agent1/TEST_RESULTS.json and agent1/README.md.

Limitations: discovered pool is bounded, not exhaustive; source/sector/geography/
parent and year-end review remains human. Automatic original-page/PDF retrieval is
not supplied; target PDFs are uploaded, search snippets are provisional. Reject
or revise returns a revision_required/rejected briefing; user corrects inputs and
reruns. Agent 2/4 and PPTX are still separate future work.

Week3Project handoff saved: checkpoint 14 freshly exports all 7 workflows.
Portable individual and combined JSON exports, manifest, and import instructions
are in n8n/saved-workflows/. Portable copies omit credential references; original
backup retains references but no credential secrets. Source code, test results,
build instructions, and progress notes are all stored in this project folder.

## Agent 2 — simple native-node collector — checkpoint 15

Built and applied `Agent2PublicResearch` (Agent 2 - Public Web and News), 11 visual
nodes including one form trigger and one sub-workflow trigger. User preference:
keep it simple, no HTTP Request nodes or GET/POST setup. Only existing native
SerpApi Google News/Google Search nodes perform network communication internally;
Code nodes perform deterministic input, date, relevance and deduplication work.
No extra accounts, cloud models, or hidden Code-node fetch calls.

Four queries per company across cyber news, leadership, contracts and technologies;
max 6 companies. Dynamic three-calendar-month America/Chicago window. Evidence
includes company, source_id, source_url, publication_date, evidence_text, provenance
and quality flags. Nested news flattened, tracking URLs deduplicated, syndicated
titles tagged. Old/unknown/conflicting dates, missing company match, title-only
records and non-IT material go to review_queue. Menu/navigation text removed before
relevance checks. Job ads marked hiring evidence, not confirmed technology use.
Coverage, missing responses and query failures remain explicit.

Live PepsiCo test: all four native searches succeeded, 20 unique sources. Final
collector regression on actual recorded output passed: 4 ready excerpts (job ads),
16 records needing review, 0 failed queries. Pure edge-case tests passed. Source
full text was not retrieved; records explicitly say full_article_retrieved=false
and source_publication_verified=false. Snippets are preliminary public evidence.
Nothing sent automatically to Agent 3, keeping inspection before model analysis.

Agent 1 Finalize Reviewed Peers → Approved for Agent 2? → Collect Public Evidence;
only approved nonempty lists execute the sub-workflow. Rejected/revised lists do
not initiate searches. Input guard tested. Production graph was freshly exported
and compared exactly against built nodes/connections after installation.

Checkpoint 15 contains all 9 workflows including separate Agent 2 live test.
All portable exports/manifest refreshed in n8n/saved-workflows; before-agent2
snapshot retained. Sources, tests, test results, simple instructions saved under
n8n/agent2/. Refresh n8n before editing externally updated workflows.

Checkpoint 16: user saw approval error when running Agent 2 manually. Execution
62 form output was an empty object. Found missing form webhookId/path. Added a
registration UUID, stable path agent2-company-research, and fieldName company_names.
Validation now accepts stable and legacy form fields; empty form data gives a
specific submission instruction instead of the Agent 1 approval error. Parent
companies_for_agent2 inputs still require approval. Actual installed n8n form
mapping function → validator test passed for PepsiCo and Nestlé; pure empty input
and rejection tests passed. Applied targeted fix, verified fresh export, saved
checkpoint 16 and refreshed portable exports. User must refresh editor, start
form listener, open newly shown Test URL, enter company and submit.

## Orchestrator and retained research memory — checkpoint 17

User prioritized building Orchestrator now, deferring Agent 4, and retaining old
research in memory. Keep it simple; no HTTP Request nodes / manual GET/POST setup.

Agent 3 check completed successfully. Native connection test passed for recorded
PepsiCo excerpt and all four synthetic signals. Empty results handled; source
IDs/URLs and quotes checked; job ads cannot establish deployments/appointments.
Found stale published snapshots when reimporting the same versionId. Fresh UUID
versions and publication solved it; source builders now generate new versions.
Agent 3 and connected Agent 2 are published for internal calls. Agent 2 sends
only evidence_records, one at a time; review_queue is excluded. Its final output
is Research and Signals. No new searches were needed for connection tests.

Research Orchestrator now extends the approved-peer pipeline with native memory
recall, compilation, local editable OOXML PowerPoint generation, native memory
insertion, and Download Briefing. Agent 4 not included. Rejection/unapproved peer
research cannot reach normal deck generation. Need original-source review still;
full page/PDF retrieval remains outside this no-HTTP-node version.

Created native Week3 Research Memory Data Table IoseclveuG5G4kFs. Persisted 31
historical research records plus one full extracted source document (32 rows,
about 1.55 MB). Archive import checks run_id existence and never overwrites.
All new research inserts dated snapshots containing evidence/findings/sources,
coverage/limitations and PowerPoint bytes. No automatic deletion configured.
Data Table capacity remains the instance's configured limit; full storage errors
rather than pruning old rows. Existing Docker bind mount /Users/home/.n8n is
persistent. Project copies live in n8n/research-memory/.

Added Research Memory - Recall (company + optional run ID; JSON/PPT downloads),
and Orchestrator - Archived Research Preview. Preview uses genuine execution 65
data plus one actual PepsiCo analysis, excludes synthetic facts, approves no peers,
and is clearly marked archived preview. It is not a finished six-company report.

Tests passed: Agent 3 real/positive examples; quotation/job-ad guards; package CRC,
all OOXML parsing and python-pptx loading; Microsoft PowerPoint opened/exported
19 slides; visual inspection and PDF text bounds showed no off-page blocks.
Native Orchestrator preview run 83 saved a deck/snapshot. Repeat run 84 appended,
recalled run 83, and identified zero repeated source URLs as newly observed.
Recall test downloaded the first saved deck and confirmed all 32 old rows remain.
Memory total after tests: 34 rows. Normal research/preview histories stay separate.

CLI native Data Table tests required initializing the standard data-table module
context (normally loaded by the n8n server). Temporary test preload file changes
no installed n8n files. Actual native table operations and permissions were used.

Saved checkpoint 17: 15 workflows, complete memory export, updated portable JSON
exports/manifest, source and test files. Current entry points:
- Research Orchestrator: 2H45pUuwyaVZc99j
- Research Memory - Recall: ResearchMemoryRecall
- Archived preview: ResearchOrchestratorPreview
Local reviewable artifact: n8n/output/PepsiCo-archived-preview.pptx (and PDF).
User must refresh editor after external imports. Agent 4 remains future work.

## Peer-review correction — checkpoint 18

Execution 86 submitted literal Company with www.pepsico.com. Old validation
accepted a Walmart USD681B snippet as that generic target, leading to zero peers
and an empty approval wait. Fixed and applied latest Orchestrator:
- Placeholder input rejection with a clear actual-company-name instruction.
- Extracted-company and evidence-company matching plus official-domain guard.
- Target and peer readiness gates: unsupported baseline/zero peers end with
  structured revision diagnostics, never an empty approval request.
- If no PDF is uploaded, native memory lookup can reuse a recent retained report
  when company, source domain, fiscal year and exact stored quote match. Otherwise
  official-site target search remains the fallback.

Tests passed for placeholder input, Walmart disguised as PepsiCo, domain mismatch,
normalization/ranking/approval guards, and actual native memory → local Gemma:
PepsiCo FY2025 annual revenue USD93,925 million from the retained official report.
No new search was needed for the passing retained-report test. The initial direct
search test correctly returned insufficient evidence rather than invented figures.

Applied fix, re-exported and compared node graph exactly. Run 86 was submitted
for Revise with Sources verified=No and no acceptance/approval; it finished and
cannot proceed with the invalid baseline. User must refresh and start a new run
with actual Company Name PepsiCo. Checkpoint 18 contains 16 workflows; portable
exports and test results refreshed in Week3Project. No old research deleted.

Progress reported by user:

- Local Ollama/Gemma visual chain test works.
- Research Orchestrator form created and tested after unpinning sample data.
- Research Settings node added with three-calendar-month start/end dates.
- Next: search the node picker for Tavily and determine available integration.

Requirements: ask for the target company each run; five same-sector revenue
peers; recent public web/news; cybersecurity and IT signals; public professional
leader employment/education matches; editable PowerPoint output. No HTTP Request
nodes. User builds and tests visually, one stage at a time.

Checkpoint 19 saved October 25, 2026: fresh export of all 16 workflows and all 34 memory rows, old archive IDs verified retained, portable exports refreshed. User requested pausing after saving; wait for further instruction.

Checkpoint 20 saved before AI-headline changes: all 16 current workflows and 36 memory rows, old archive IDs verified preserved, portable exports refreshed. Pending user request: enhance Agent 2 with AI-assisted discovery using local Ollama or free Google AI, returning headlines and source links. No enhancement changes applied before this checkpoint.


### Save requested before continuing — 20261025-103611
Saved project files to `n8n/backups/project-save-20261025-103611.tar.gz`. Existing live workflow checkpoint 20 remains retained. Agent 2 AI headline enhancement files are saved as unfinished local work; they have not been applied to the live workflow.


### Checkpoint 21 — Agent 2 AI headline enhancement applied
Agent 2 now uses local gemma4:12b once to plan at most one extra query per company. Four core searches remain the fallback. Headlines and source URLs are copied from public results, with dates from search metadata. Job ads and titles without the company name are excluded; undated candidates remain separate. Existing Agent 3 handoff retained. No HTTP Request nodes added.
Live PepsiCo test: 5/5 queries succeeded, 25 unique sources. Cached replay after tightening the company-title filter produced 3 dated headlines across 3 domains, plus 1 undated candidate. Pure planner/fallback and collection tests passed. See agent2/AI_HEADLINES_TEST_RESULTS.json. Production Agent2PublicResearch imported and published with a new version; exported activeVersionId matches versionId. Saved all 17 workflows in backups/workflows-2026-10-25-checkpoint-21-ai-headlines.json and refreshed portable exports. Existing memory retained.


### Agent 3 tightening in progress
Checkpoint 22 preserves the live workflows before this change. Added conservative company-attribution, generic-advice, deployment and contract-value guards; deterministic tests pass. Local model regression exposed JSON format errors, now being retested with explicit parser-envelope instructions. Production Agent 3 has not yet been changed. All source changes and recorded fixtures saved under n8n/agent3.


### Checkpoint 23 — Agent 3 tightened and published
Nine recorded real excerpts completed with zero model/parser errors and three retained signals. Generic NIST/oversight claims and another-employer appointment excluded; hiring/digital twins retained; AI media status reported. Added explicit JSON envelope and temperature zero. Deterministic tests passed. Published version matches active version. Saved workflow backup and portable exports; report agent3/ATTRIBUTION_TEST_RESULTS.json.


### Agent 4 build in progress
User requested company CEO/CISO/CTO/CIO discovery, then public professional background. Built native Google + local Gemma workflow with append-only memory; deterministic tests and PowerPoint integration tests pass. Initial live test found two candidates and exposed former-leader conflict; added reconciliation and simplified discovery queries. Retest in progress. Production not changed yet.


### Checkpoint 24 — Agent 4 installed and saved
Built/published Agent4LeadershipBackground with company form and internal trigger. Four native role-discovery searches and up to three background searches per distinct leader (max four). Local Gemma extracts source-linked role/background candidates; deterministic guards reject unsupported quotes, regional/former/future role substitutions, client/award employment inferences, fandom/speaking/honorary education inferences and separate campuses. Conflicting/departed-role evidence remains explicit. Native Data Table appends leadership_background; tests use leadership_background_test.
Orchestrator reads latest saved production backgrounds for researched companies and includes dated, caveated leader slides and source citations in PPT; approval unchanged. Agent 4 runs separately before the orchestrator to avoid automatic extra searches for every peer.
Live native search/local Gemma tests completed; final cached regression passed with 2 people, 5 background claims, zero background model errors, and 1 recorded upstream search failure correctly marked partial. CEO preliminary, CISO disputed, CTO conflicting, global CIO not found in test evidence. No assertion of verified current leadership.
All 36 prior memory rows verified byte-for-byte unchanged. Memory now has 40 rows including 4 separate test records. All 20 workflows exported, published Agent 2/3/4 versions verified, portable exports refreshed. See agent4/TEST_RESULTS.json, agent4/README.md and backups/workflows-2026-10-25-checkpoint-24-agent4.json.


### Checkpoint 26 — Public LinkedIn search and visual PowerPoint applied
Saved checkpoint 25 before changes. Added one dedicated public LinkedIn Google query per discovered leader (4 background searches/person, max 20 initial searches/company). Accepts only real LinkedIn /in/ URLs for the dedicated profile feed, retains source provenance, and labels snippets as not full-profile retrieval. No LinkedIn login, profile-page fetch or HTTP Request node.
Live test for Michael Fiddelke at Target: one native Google query, one matched profile snippet, one extracted claim, local Gemma complete without errors. Query/URL/identity/deduplication/failure tests pass. Published Agent 4 current version verified.
Rebuilt PPT renderer with editable native cards, KPI dashboard, comparable revenue bars, categorized signal counts, compact company/leadership snapshots, public LinkedIn links and a source appendix. Up to three highlighted signals/company; full findings/quotes/registry retained in research memory. Peer approval unchanged.
Visual checks: actual Microsoft PowerPoint open/PDF export and rendered image inspection; 4-slide saved Target leadership preview; archived multi-company preview consolidated from 19 to 7 slides. Six-company synthetic stress test uses 6 main slides plus sources. ZIP/XML/editable shapes, bounds, citations and n8n execution tests passed. Preview uses retained data and is explicitly labeled, not stored as new research.
Final backup contains 22 workflows. All 41 existing memory rows verified unchanged, including the real saved Target profile and old presentations. Refreshed sanitized workflow exports, memory export, setup docs and test reports. See agent4/LINKEDIN_TEST_RESULTS.json and orchestrator/VISUAL_TEST_RESULTS.json.


### Target production research and Git synchronization in progress
User authorized execution without pre-approval and requested synchronization to https://github.com/amitgandre/Mavens-Week3-AmitG.git. Destination repository is empty; initialized local main branch using configured Git identity. Credentials, environment files, raw backups, memory exports, downloaded source PDFs and generated previews are excluded. Final sync will follow the completed production run and saved sanitized workflow exports.


### Checkpoint 28 — Target presentation completed; GitHub export prepared
Target final briefing research-178 is saved locally as Target-final-briefing.pptx, PDF, and complete research JSON. Eleven slides cover Target and five peers, fourteen extracted signals and 288 source records. PowerPoint opened/exported successfully; package XML, PDF page count/text and slide-shape bounds passed. Public snippets remain preliminary evidence. See orchestrator/TARGET_FINAL_TEST_RESULTS.json.
Saved fresh local backup of all 28 workflows, including temporary production-run workflows. Refreshed 22 portable project/test workflows from this backup with credentials, runtime state and account-sharing metadata removed. Latest production definitions include automatic peer configuration and low-credit searches. Research memory, downloaded documents, raw backups and generated presentation artifacts stay local and are excluded from GitHub.


### Project walkthrough and dedicated covers completed
GitHub sync completed at 482f072, preserving the remote initial commit. Built the second requested presentation: Project-overview.pptx (16 slides), covering goals, all four agents, architecture, five actual n8n workflow screenshots, run/setup instructions, example results, deliverables, validation and handoff. Speaker notes capture current automatic peer decisions, reduced search budgets, seven-day profile cache and import caveats. Added a dedicated cover to Target-final-briefing.pptx (now 12 slides). Both decks exported through Microsoft PowerPoint. Presentation builder source is retained in n8n/project-overview/. Generated artifacts remain local.
