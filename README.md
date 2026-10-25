# Public-source IT and cybersecurity research

Final validation run **196** completed all four agents, PowerPoint generation and memory retention. Only **1/5 peers qualified**, so five-peer coverage remains unmet. The reviewed fixes are in [proposed workflows](n8n/proposed-workflows/README.md); they have now been published to live n8n following explicit approval. [Presentations and captioned video](presentations/README.md) are now included in this repository.

The n8n Orchestrator connects all four agents, recalls or refreshes Agent 4 profiles, generates editable PowerPoint briefings,
and retains dated research and presentations in persistent local memory.
Agent 4 discovers public CEO/CISO/CTO/CIO candidates and researches professional background.

Start with [Orchestrator instructions](n8n/orchestrator/README.md).

- Agent 1 discovers revenue peers and applies the user-authorized automatic decision, retaining verification gaps.
- Agent 2 collects source-linked headlines using native SerpApi nodes. Current low-credit mode disables AI query expansion.
- Agent 3 extracts supported IT/security signals using local Gemma.
- [Agent 4](n8n/agent4/README.md) finds leadership candidates and researches professional roles, Deloitte/KPMG/EY employment and SEC-school education. The orchestrator runs it when matching saved profiles are missing or more than seven days old.
- The Orchestrator compares prior research, compiles the briefing, creates the
  PowerPoint, and saves a new memory snapshot.
- Research Memory - Recall retrieves prior JSON and PowerPoint versions.

The pipeline uses no HTTP Request nodes or manual GET/POST configuration.
Search snippets remain preliminary evidence and require original-source review.

## Saved project artifacts

- [Saved workflows and import guidance](n8n/saved-workflows/README.md)
- [Orchestrator/memory test results](n8n/orchestrator/TEST_RESULTS.json)
- [Agent 3 evidence-tightening test](n8n/agent3/ATTRIBUTION_TEST_RESULTS.json)
- Agent 4 test results: `n8n/agent4/TEST_RESULTS.json`
- [Progress and decisions](n8n/PROGRESS.md)
- Preview PowerPoint/PDF: `n8n/output/PepsiCo-archived-preview.*`
- Retained memory export: `n8n/research-memory/memory-export.json`
- Complete workflow backups: `n8n/backups/`

Earlier research records, extracted documents, and tested preview snapshots remain retained. Test data is kept separate from production research. Native memory persists in the existing n8n database; preserve the database along with project exports when migrating.

`research.py`, `.env.example`, and the earlier build guide are historical
prototypes. They are not the current Orchestrator entry point.

New briefings use a consolidated visual PowerPoint layout. [Target design preview](n8n/output/Target-visual-preview.pdf) uses retained background research; leadership profiles refresh under the orchestrator’s seven-day cache policy.

## Project walkthrough presentation

The second presentation covers project goals, all four research agents, architecture, actual n8n screenshots, run/setup instructions and deliverables. Both it and the Target research briefing include dedicated covers. Rebuild with `python3 n8n/project-overview/build_presentation.py` after capturing the local screenshots described in that source. Generated decks/PDFs/screenshots stay local under `n8n/output/`.
