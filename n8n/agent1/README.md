# Agent 1: revenue peer research

Current input/source safeguards reject placeholder company names, require the
extracted company and cited evidence to match, and restrict target web evidence
to its official domain. Missing baseline revenue and zero eligible peers return
revision diagnostics instead of an empty approval form. With no new PDF upload,
the Orchestrator can reuse a recent retained annual report when its stored source
URL, company, fiscal year and exact quotation match. Retained reports remain
subject to human review for newer filings. See PEER_FIX_TEST_RESULTS.json.

This extends **Research Orchestrator** with an end-to-end, human-reviewed peer
selection pipeline. It uses native visual SerpApi nodes, local Ollama/Gemma,
structured parsers, IF/Split Out nodes, and named Code nodes for deterministic
validation and arithmetic. There are no HTTP Request nodes or cloud LLM calls.

## Run it

1. Refresh Research Orchestrator after an external update before editing it.
2. Open **On form submission** and start its test form.
3. Enter company, official website, specific sector, and geography.
4. Optionally upload a text-readable annual report and enter its public URL.
   Without a report, the workflow searches for the target revenue too.
5. Optional revenue ratio bounds default to 0.5 and 2. These are strict criteria,
   not a promise that five qualifying peers exist.
6. Wait for discovery, candidate revenue extraction, currency checks, and ranking.
7. Inspect **Rank Revenue Peers → Output → JSON**. It contains target revenue,
   proposed peers, alternatives, exclusions, evidence quotations, source URLs,
   and explicit shortfalls. Follow **review_url**, or the Wait node's review link.
8. Verify original sources, periods, units, FX direction, sector/geography, and
   corporate relationships. Choose Approve/Revise/Reject on **Review Revenue Peers**.
   Approval requires Sources verified = Yes. A shortfall requires explicit acceptance.
9. **Finalize Reviewed Peers** exposes `companies_for_agent2` only after valid
   approval. Rejected/revision-required outputs contain an empty handoff list.

No Agent 2 research is started automatically by this workflow.

## What is verified mechanically

- Extracted amount is a finite positive number, in declared original reporting units.
- Source URL exists in supplied evidence; supporting quotation is an actual substring.
- Quotation contains the amount, and the cited evidence contains the fiscal year.
- Consolidated scope, ISO currency, fiscal year, and units are present.
- Candidate is not the target or a repeated parent group; sector fit is marked same.
- Fiscal-year label matches the target, and the revenue ratio lies within the bounds.
- Ranking uses absolute log distance from target revenue and selects at most five.

These checks establish traceability and consistency, not independent truth.
Model sector classifications, annual versus segment scope, year-end comparability,
and FX statements require human review. A quote check cannot authenticate a publisher.

## Currency handling

Same-currency values need no conversion. Up to three missing currencies trigger
bounded annual-average FX searches. Unsupported FX evidence remains excluded.
You can supply verified rates using the optional FX Rates JSON form field:

```json
{
  "CHF": {
    "to_target": 1.1,
    "target_currency": "USD",
    "period": "2025",
    "source_url": "https://example.com/verified-fx-source"
  }
}
```

This is a structural example, not a real exchange rate. `to_target` means target
currency per one source-currency unit. Use a sourced average for the revenue period.

## Limits

Search snippets often lack sufficient financial detail. The workflow returns
missing evidence/shortfall rather than filling gaps from model memory. Uploaded
PDFs supply actual document text; automatic original-page/PDF retrieval has not
been added under the no-HTTP-Request-node design. Source review is an explicit
part of the completed workflow. Use a precise sector to avoid broad consumer-goods
rankings admitting unrelated companies.

Maximum initial search budget: one discovery, up to ten candidate revenues,
up to three FX searches, plus one target search if no PDF. A transient retry can
increase billed requests. SerpApi may serve cached results. No recurring execution
or paid plan is configured. Research news dates do not restrict annual-report dates.

The peer pool is bounded; the output ranks discovered eligible companies and
does not claim an exhaustive global nearest-neighbor search.

## Developer files

- `build_agent1.py`: transforms a workflow export while reusing credential references.
- `normalize_record.js`: source and revenue checks embedded in Code nodes.
- `rank.js`: deterministic filtering, conversions, and ranking.
- `test_logic.cjs`: meaningful edge-case and approval tests.
- `build_test.py`: separate replayable test with cached input report/discovery,
  real local model calls, native revenue searches, and an unapproved final result.

Run `node n8n/agent1/test_logic.cjs /path/to/generated-workflow.json` for pure
validation/ranking and approval-gate tests. Credential secrets are never exported.
