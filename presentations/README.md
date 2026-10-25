# Presentations and captioned walkthrough

- [Project overview PowerPoint](Project-overview.pptx) · [PDF](Project-overview.pdf): 16 slides covering goals, four agents, architecture, actual n8n screenshots, run/setup instructions and deliverables.
- [Final Target research PowerPoint](Target-final-briefing.pptx) · [PDF](Target-final-briefing.pdf): six slides, including a dedicated cover, based on final validation run 196.
- [How to run the project](How-to-run-project.mp4) · [SRT captions](How-to-run-project.srt): 60 seconds, 1280×720 H.264, silent with burned-in instructional captions. Uses real workflow/execution screenshots plus an illustrative panel showing the actual company-form fields. Waiting is compressed.

Both PowerPoints have dedicated cover slides and were opened/exported in Microsoft PowerPoint. The final run executed all four agents and saved its research snapshot. **Only one of five requested peers qualified**: Target and Kroger, two signals, 39 source records. The earlier six-company presentation is retained in the local pre-test archive; the final briefing reports the new run rather than copying its earlier results.

The tested workflow changes have **not been imported/published to live production**, because automatic approval review required explicit authorization for that persistent change. The `Refresh Leadership` option shown in the walkthrough belongs to the tested proposal. See [the reviewable proposal](../n8n/proposed-workflows/README.md) and [execution results](../n8n/orchestrator/FINAL_E2E_TEST_RESULTS.json).

Presentation and video generation source lives in `n8n/project-overview/`. Screenshots needed to rebuild are included in its `assets/` folder. The complete underlying research JSON, persistent memory and raw workflow backups remain local; no credential secrets are included here.
