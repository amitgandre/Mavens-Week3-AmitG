# Orchestrator and retained research memory

## Run new research

1. Open **Research Orchestrator**, refresh, and submit its company form.
2. Review Agent 1's proposed revenue peers at **Review Revenue Peers**.
3. After approval, Agents 2 and 3 collect and analyze public evidence.
4. The Orchestrator recalls previous research, builds an editable PowerPoint,
   and saves the complete research and presentation as a new memory snapshot.
5. Download **Download Briefing → Binary → presentation**.

Run [Agent 4](../agent4/README.md) separately for each desired company before a new briefing. The orchestrator reads the latest saved matching company profiles (up to 500 recent background records), includes source links in PowerPoint, and labels their save dates and verification limits. It does not automatically spend additional search quota on leadership discovery for every peer.

There are no HTTP Request nodes, GET/POST configuration,
external rendering services, or cloud models. Native search integrations handle
their network communication. Agent 3 uses local Ollama; the deck is generated
with local OOXML code.

Agent 2/3 are published for internal calls. Reimports require a fresh version ID
and publication to avoid calling an old snapshot. Normal UI runs need no CLI
test harness or new account.

## Recall old research

Open **Research Memory - Recall**, start its form, enter the same company name,
and optionally a run ID. **Download Saved Research** returns JSON downloads and
the PowerPoint when available. It shows 20 matches at a time; older rows remain
stored and can be retrieved by run ID.

The native **Week3 Research Memory** Data Table retains dated snapshots in n8n's
persistent local database. New runs insert rows; no update/delete node exists.
Stored content includes evidence, findings, sources, coverage gaps, dates, and
PowerPoint bytes. Historical material is compared, never silently reused as news.

31 old research records and one full extracted report were preserved. They are
marked `legacy_research`/`source_document`, not newly verified briefings. Duplicate
archive IDs are skipped. Completed research uses `research_snapshot`; previews
use `research_preview` and are excluded from normal research comparisons.

There is no automatic expiry. The table is subject to n8n's configured Data Table
capacity; a full table produces an error rather than deleting old rows. Execution
log pruning does not remove table rows. Preserve `/Users/home/.n8n` when migrating
n8n. A project-local memory export is in `../research-memory/`; workflow exports
alone do not contain the memory table.

## Preview and validation

**Orchestrator - Archived Research Preview** uses real archived evidence, makes
no new searches, approves no peers, and includes no synthetic findings. Only
one excerpt was analyzed; the preview is not a finished six-company report.

Validation covered Agent 3 real/positive examples; old-memory import; two distinct
saved previews; previous-run recall; old-row preservation; PowerPoint download;
package/XML parsing; and opening/exporting all 19 slides in Microsoft PowerPoint.
Visual inspection and PDF bounds checks found no off-page text blocks.
Unapproved research is blocked from normal briefing generation.

`enable_table_cli_tests.cjs` initializes the native data-table module for CLI
tests, which omit the server's normal module context. It modifies no installed
n8n files. Preview artifacts are in `../output/`.

Search snippets remain preliminary evidence. Full article retrieval is not
included; original sources and publication dates still need review.


## Visual presentation layout
The deck combines cover/overview into one dashboard, compares peer revenue and categorized signal counts on one slide, and groups up to two companies per snapshot. Leadership roles, requested prior-firm matches, SEC-school education, and public LinkedIn links appear with the company findings. Native editable PowerPoint cards, bars and badges use a navy/teal theme. Signal counts are observations, not security-risk scores.

Main slides show up to three selected signals per company, prioritizing leadership/contracts/cyber news over technology mentions. Complete findings, quotations and the full source registry remain in the saved research JSON. The compact appendix lists clickable sources used by displayed highlights. Old saved presentations remain unchanged; new runs use the new renderer.

Run `node n8n/orchestrator/test_visual.cjs` for consolidation, layout bounds, public LinkedIn links and editable graphic checks. Target preview: four slides. Archived multi-company preview: seven slides (previously nineteen). Preview material is labeled and not saved as fresh research.
