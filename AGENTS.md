# Project agent memory

This file is the project's committed home for project-intrinsic agent knowledge: build, test, release, architecture, and sharp-edge notes that should travel with the code.

- Add durable project-specific notes here as they are discovered through real work.
- Architecture: `docs/architecture.md`. Design rationale: `principles.md`. Full usage/discoveries: `README.md`.
- The embedding-clustering precompute (`scripts/preprocess.py`'s `embed`/`cluster-per-dataset`/
  `noise-lens` subcommands, feeding `datasets/<id>-coherence.json` + `datasets/<id>-outliers.json`)
  embeds the full ~410K-row corpus once (`embed`, single-core, ~5-10 min, caches embeddings + row
  metadata to the local, gitignored `scripts/.cache/clustering/`), then clusters **each dataset
  separately** (`cluster-per-dataset`, reusing the cached embeddings -- no re-embedding). Direct
  HDBSCAN on the raw 384-dim MiniLM vectors stalls -- UMAP-reduce first (15d per-dataset). There
  is also a `cluster` subcommand that clusters the FULL corpus combined in one UMAP+HDBSCAN pass;
  it is unused by the current artifacts and left in for reference, because in practice its UMAP
  construction step alone ran 3.5+ hours at full scale and never finished within a workable
  window -- per-dataset clustering is what actually ships. BeaverTails (300K+ rows) is too large
  even per-dataset at full resolution, so it's stratified down to ~50K rows before clustering (see
  `_stratified_subsample`); `noise-lens` skips any row a cluster pass didn't cover (`eligible.npy`).
- **Sequencing gotcha:** every `preprocess.py` command re-derives the service-worker `CACHE_NAME`
  at the end (`sync_sw_cache_name()`), which hard-fails if `service-worker.js`'s `URLS_TO_CACHE`
  references a file that doesn't exist yet. Run `embed` → `cluster` → `noise-lens` to completion
  (or regenerate any per-dataset artifact) *before* adding its filename to `URLS_TO_CACHE`, then
  run `python3 scripts/preprocess.py sw` once to finalize the hash.

## Maintaining this file

Keep this file for knowledge useful to almost every future agent session in this project.
Do not repeat what the codebase already shows; point to the authoritative file or command instead.
Prefer rewriting or pruning existing entries over appending new ones.
When updating this file, preserve this bar for all agents and keep entries concise.
