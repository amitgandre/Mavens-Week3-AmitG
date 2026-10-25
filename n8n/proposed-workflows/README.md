# Reviewed final orchestrator configuration — published after approval

`research-orchestrator-final-e2e.json` preserves the reviewed portable configuration. After explicit user approval, the exact research graph was imported and published to the live orchestrator. The portable copy remains inactive and excludes credential references; the active production version is verified against the tested proposal.

Changes compared with the installed baseline:

- Financial extraction requests short verbatim quotes. If a model appends unrelated table text, an exact supported first revenue row can be retained; altered amounts, wrong companies and unsupported rows remain blocked, and the original model quotation remains in the research record.
- Four complementary financial-discovery searches feed a deduplicated candidate pool of up to twelve companies. The final output still caps at five eligible peers. This can use more search quota than the installed one-search/five-candidate discovery stage.
- An optional `Refresh Leadership` form field accepts `yes` to force live Agent 4 research. Blank preserves the seven-day saved-profile cache.

The research parameters and routing were compared against successful execution **196**, allowing the form-input adapter and runtime-injected n8n defaults. That run executed all four agents, reached Download Briefing and saved memory, but selected only **one** eligible peer. Five-peer content coverage remains incomplete; no eligibility checks were relaxed to fill the gap.

[Full test report](../orchestrator/FINAL_E2E_TEST_RESULTS.json). The approved publication changes future runs and may increase native search usage.
