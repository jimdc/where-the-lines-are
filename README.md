# Where the Lines Are

**Content warning**: this tool displays real-world text that was flagged as harmful. Expect shocking language.

## What is this?

Where the Lines Are is a visualization tool for studying how content moderation categories overlap, co-occur, and cluster in real prompt data. It treats a classification dataset not as a lookup table but as a structure worth seeing — a place where patterns in how humans produce harmful text become visible through careful graphic design.

The interface follows Edward Tufte's principles from *The Visual Display of Quantitative Information*: maximize data density, eliminate chartjunk, label everything directly, and let the data speak through its structure rather than through decoration. Every pixel either carries data or gets out of the way.

## Datasets

Seven labeled datasets ship with the tool, spanning 2018–2025, plus one taxonomy-only deployment-classifier layer (2025–26) — tracing the arc from comment-section toxicity detection through the current frontier paradigm where classifiers intercept model **outputs** on a CBRN/biosecurity axis:

| Dataset | Source | Year | Rows | Categories | License |
|---------|--------|------|------|-----------|---------|
| **Jigsaw Toxic Comments** | [Google Jigsaw](https://huggingface.co/datasets/Arsive/toxicity_classification_jigsaw) | 2018 | 32,450 | 6 | CC0 |
| **OpenAI Moderation** | [OpenAI moderation-api-release](https://github.com/openai/moderation-api-release) | 2022 | 1,680 | 8 | MIT |
| **BeaverTails** | [PKU-Alignment](https://huggingface.co/datasets/PKU-Alignment/BeaverTails) | 2023 | 300,567 | 14 | CC-BY-NC-4.0 |
| **PKU-SafeRLHF** | [PKU-Alignment](https://huggingface.co/datasets/PKU-Alignment/PKU-SafeRLHF) | 2024 | 38,640 | 19 | CC-BY-NC-4.0 |
| **NVIDIA Aegis v2** | [NVIDIA](https://huggingface.co/datasets/nvidia/Aegis-AI-Content-Safety-Dataset-2.0) | 2024 | 29,095 | 23 | CC-BY-4.0 |
| **AIR-Bench 2024** | [Stanford CRFM](https://huggingface.co/datasets/stanford-crfm/air-bench-2024) ([arXiv 2407.17436](https://arxiv.org/abs/2407.17436)) | 2024 | 5,694 | 16 | CC-BY-4.0 |
| **MLCommons AILuminate v1.0** | [MLCommons](https://github.com/mlcommons/ailuminate) ([arXiv 2503.05731](https://arxiv.org/abs/2503.05731)) | 2025 | 1,200 | 12 | CC-BY-4.0 |
| **Anthropic Constitutional Classifiers** *(taxonomy only)* | [Anthropic](https://www.anthropic.com/research/constitutional-classifiers) ([arXiv 2501.18837](https://arxiv.org/abs/2501.18837)) | 2025–26 | — | 4 (CBRN) | N/A |

The first seven share the same multi-label binary structure (each row has one or more flagged categories) but slice content moderation differently. Jigsaw uses 6 behavioral categories (toxic, obscene, insult, threat) from Wikipedia comments — the pre-AI-safety worldview. OpenAI introduced hierarchical severity (hate → hate/threatening). BeaverTails added financial crime, terrorism, and privacy. SafeRLHF expanded to 19 categories including cybercrime, mental manipulation, and environmental damage. Aegis reached 23 with profanity, malware, and unauthorized advice. The taxonomy evolution is the story — click a dataset panel at the top to switch; all visualizations rebuild from scratch.

### The deployment-classifier era (2025–26)

Across the first five datasets — 70 categories in total — there is **no biology or CBRN category at all**. Yet that is precisely the axis frontier labs now draw lines on in production: real-time classifiers that read model **outputs** and block chemical, biological, radiological, and nuclear (CBRN) uplift. The 2024–26 layer closes that gap:

- **AIR-Bench 2024** (Stanford CRFM) is a policy-derived taxonomy — 5,694 prompts distilled from 8 government regulations and 16 company policies into a 4-level tree (4 → 16 → 45 → 314). Rolled up to its 16 Level-2 categories, it is the first labeled dataset here whose taxonomy reaches **Weapon Usage & Development** (bioweapons, chemical, nuclear, radiological) and a dedicated cyber/**Security Risks** axis. It is single-label at the leaf, so its co-occurrence is near-diagonal by design — its contribution is taxonomic breadth, not co-activation structure.
- **MLCommons AILuminate v1.0** ships a public 1,200-prompt DEMO set (a 10% practice subset, CC-BY-4.0) labeled across the 12-hazard AIRR taxonomy — including a dedicated, *measured* **Indiscriminate Weapons (CBRNE)** hazard (100 prompts).
- **Anthropic Constitutional Classifiers** is a *taxonomy-only* layer: a real frontier deployment classifier whose CBRN categories (chemical, biological, radiological, nuclear) are published, but whose row-level corpus is **not** public. It is rendered as a labeled column in the Rosetta crosswalk and Drift timeline, badged "taxonomy only," and carries **no counts, co-occurrence, or statistics** — the honest representation of a category list with no measurable data behind it (see *Measured vs. taxonomy-only*, below).

## What can you discover?

Moderation categories are not independent. The visualizations expose their hidden geometry — differently for each dataset.

**Some categories never travel alone.** In Jigsaw, "severe toxic" is *never* flagged in isolation — it always co-occurs with other categories. In OpenAI, sexual/minors, hate/threatening, and violence/graphic behave identically — they appear only when a parent category is also flagged. Self-harm, by contrast, is 92% exclusive. Switch to BeaverTails and the profile changes: animal abuse is highly exclusive while discrimination is almost always shared.

**Violence is the connective tissue of harm.** The co-occurrence matrix shows that violence co-occurs with nearly every other category. Click the violence row and the word frequencies shift to "kill," "destroy," "war." Sexual content barely touches violence. These categories live in different neighborhoods — visible across all three datasets.

**Word distributions reveal category boundaries.** Click a word in the frequency strip and the breakdown panel shows how that word distributes across categories. The proportional bars make cross-category signatures immediately comparable.

**Rare combinations are the most informative.** The surprise metric sorts prompts by the rarity of their category combination. Edge cases reveal where category boundaries blur and where annotators were forced to make judgment calls across multiple dimensions simultaneously.

**The binary matrix shows population structure.** Each row of data becomes a thin strip of dark and light cells. Vertical dark bands show which categories dominate; horizontal patterns reveal clusters; scattered dark cells mark outliers. BeaverTails renders 300K rows at full density.

**Cross-dataset comparison reveals taxonomy design choices.** The Rosetta Stone table maps ~20 harm concepts across all eight taxonomies, showing how "privacy" becomes "PII/privacy" in Aegis, or how "minors" is split from "sexual" in some taxonomies but merged in others. The new **CBRN / biosecurity** row stays empty (—) across all five legacy datasets and only fills in for AIR-Bench, AILuminate, and the Anthropic deployment classifier — making the arrival of the bio axis visible at a glance. The Drift timeline shows this evolution chronologically — bold entries mark concepts appearing for the first time.

**Measured vs. taxonomy-only.** The tool draws a hard line between datasets with a real labeled corpus (which get counts, co-occurrence, exclusivity, and every other statistic) and *taxonomy-only* layers — published category lists with no public row data. Taxonomy-only entries appear only in the Rosetta crosswalk and Drift timeline, are badged in amber, and have **no** statistics computed or shown. Absence of row data is rendered as absence, never inflated into false density.

**Annotators disagree more than you'd expect.** The Split Verdict chart (SafeRLHF) shows that two independently classified responses disagree 8% of the time on privacy, but only 1% on trafficking. The safer response is not the better one 24% of the time. For Aegis, human labels agree perfectly while LLM jury labels diverge 36% between prompt and response safety.

**Same prompt, different labels.** 6,640 prompts appear in two or more datasets. The Doppelganger feature marks these in the results table — click to see how each taxonomy classified the identical text. The Consensus chart summarizes concept-level agreement: hate and privacy get 60%+ agreement across datasets, while toxicity and harassment get 0% (concepts that only some datasets track).

## Design

The visualizations apply Tufte's principles throughout: high data-ink ratio, direct labeling, small multiples, data-text integration, grayscale palette, and zero external dependencies. Every chart is rendered in purpose-built canvas code with no frameworks. All visualizations adapt their sizing, font, and layout automatically for 6 to 23 categories. A single amber accent is the one departure from pure grayscale — reserved exclusively for marking taxonomy-only data (the absence of a labeled corpus), so the encoding itself signals "no measured data here."

See [principles.md](principles.md) for the full design rationale with specific Tufte page citations.

## Usage

Open `index.html` in a browser. Everything updates reactively — click a category, click a matrix cell, click a word, type a search, toggle a pill. No server required for the smaller datasets (works via `file://`), though `python3 -m http.server` is recommended to load BeaverTails (51MB). A service worker caches datasets after first load for offline use.

## File structure

```
index.html              Main page
dataset-loader.js       Registry + dataset + xref loading (file:// and HTTP)
static/vis.js           All canvas visualizations (~1000 lines)
static/styles.css       Tufte-inspired stylesheet
datasets/
  registry.json         Dataset manifest with schemas, concepts, stats
  xref.json             Cross-dataset prompt matching index (6,640 entries, 1.2 MB)
  xref-fuzzy.json       Fuzzy (near-duplicate) cross-dataset matches
  jigsaw.json           32,450 rows (13 MB)
  openai.json           1,680 rows (1.2 MB)
  beavertails.json      300,567 rows (51 MB)
  saferlhf.json         38,640 rows (26 MB, includes divergence fields)
  aegis.json            29,095 rows (14 MB, includes divergence fields)
  airbench.json         5,694 rows (5 MB, AIR-Bench 2024 L2 rollup)
  ailuminate.json       1,200 rows (0.3 MB, AILuminate v1.0 DEMO)
  *.js                  JS wrappers for file:// protocol
                        (Anthropic Constitutional Classifiers is taxonomy-only —
                         it lives in registry.json with rows:null, no data file.)
scripts/
  preprocess.py         One-time HuggingFace/GitHub → JSON pipeline + stats + xref
tests/
  unit/                 Pure-function unit tests (node --test)
  data/                 Independent data-validation for AIR-Bench, AILuminate,
                        and the taxonomy-only integrity invariants
  browser/              Playwright smoke tests
```
