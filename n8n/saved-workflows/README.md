# Saved n8n workflows

These are portable exports of all saved workflows, including the completed
Research Orchestrator and the isolated test workflows. `all-workflows.json`
contains the complete set; individual JSON files allow selective imports.

Import the desired JSON through n8n's workflow menu. Credential references are
removed from these portable copies: select your local Ollama and SerpApi
credentials after importing. Credential secrets are not included. The backup
under `../backups/workflows-approved-final-publication.json` preserves references
for restoring into the current instance, but also contains no credential secrets.

These exports are not a full n8n database or credential backup. Preserve the
existing n8n Docker volume separately if migrating the full installation.

Research memory is exported separately in `../research-memory/memory-export.json`.
The current installation uses a persistent host bind mount at `/Users/home/.n8n`.
See `../orchestrator/README.md` for the current pipeline and history-recall entry points.

Start with Research Orchestrator. Integration-test workflows are separate from
normal use; the live integration test consumes SerpApi search allowance, while
the cached regression test reuses recorded evidence. Review-gate tests use
synthetic company data. Agent 1 source and test documentation is in `../agent1/`.

`manifest.json` records workflow names, node counts, and individual file hashes.

Portable exports reflect the final Target briefing work, automatic peer-selection configuration, and low-credit search settings. Review configuration before running; portable workflows import inactive. Temporary production-run workflows remain in the local backup.

Refresh portable exports with `python3 scripts/export_portable_workflows.py <local-backup.json>`. This strips credential references, pinned execution data, runtime state, and account-sharing metadata. Configure local credentials and publish internal-call workflows after import.

The approved final orchestrator includes four financial-discovery queries, a pool of up to twelve candidates and optional `Refresh Leadership=yes`. Its published company form and n8n readiness returned HTTP 200 after restart. Final-run five-peer coverage remains incomplete; see `../orchestrator/FINAL_E2E_TEST_RESULTS.json`.
