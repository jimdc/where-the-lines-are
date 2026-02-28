# Where the Lines Are

**Content warning**: this tool displays real-world text that was flagged as harmful. Expect shocking language.

## What is this?

Where the Lines Are is a visualization tool for studying how content moderation categories overlap, co-occur, and cluster in real prompt data. It treats a classification dataset not as a lookup table but as a structure worth seeing — a place where patterns in how humans produce harmful text become visible through careful graphic design.

The interface follows Edward Tufte's principles from *The Visual Display of Quantitative Information*: maximize data density, eliminate chartjunk, label everything directly, and let the data speak through its structure rather than through decoration. Every pixel either carries data or gets out of the way.

## Datasets

Five datasets ship with the tool, spanning 2018–2024 — from the founding era of comment-section toxicity detection through the current AI safety guardrail paradigm:

| Dataset | Source | Year | Rows | Categories | License |
|---------|--------|------|------|-----------|---------|
| **Jigsaw Toxic Comments** | [Google Jigsaw](https://huggingface.co/datasets/Arsive/toxicity_classification_jigsaw) | 2018 | 32,450 | 6 | CC0 |
| **OpenAI Moderation** | [OpenAI moderation-api-release](https://github.com/openai/moderation-api-release) | 2022 | 1,680 | 8 | MIT |
| **BeaverTails** | [PKU-Alignment](https://huggingface.co/datasets/PKU-Alignment/BeaverTails) | 2023 | 300,567 | 14 | CC-BY-NC-4.0 |
| **PKU-SafeRLHF** | [PKU-Alignment](https://huggingface.co/datasets/PKU-Alignment/PKU-SafeRLHF) | 2024 | 38,640 | 19 | CC-BY-NC-4.0 |
| **NVIDIA Aegis v2** | [NVIDIA](https://huggingface.co/datasets/nvidia/Aegis-AI-Content-Safety-Dataset-2.0) | 2024 | 29,095 | 23 | CC-BY-4.0 |

All five share the same multi-label binary structure (each row has one or more flagged categories) but slice content moderation differently. Jigsaw uses 6 behavioral categories (toxic, obscene, insult, threat) from Wikipedia comments — the pre-AI-safety worldview. OpenAI introduced hierarchical severity (hate → hate/threatening). BeaverTails added financial crime, terrorism, and privacy. SafeRLHF expanded to 19 categories including cybercrime, mental manipulation, and environmental damage. Aegis reached 23 with profanity, malware, and unauthorized advice. The taxonomy evolution is the story — click a dataset panel at the top to switch; all visualizations rebuild from scratch.

## What can you discover?

Moderation categories are not independent. The visualizations expose their hidden geometry — differently for each dataset.

**Some categories never travel alone.** In Jigsaw, "severe toxic" is *never* flagged in isolation — it always co-occurs with other categories. In OpenAI, sexual/minors, hate/threatening, and violence/graphic behave identically — they appear only when a parent category is also flagged. Self-harm, by contrast, is 92% exclusive. Switch to BeaverTails and the profile changes: animal abuse is highly exclusive while discrimination is almost always shared.

**Violence is the connective tissue of harm.** The co-occurrence matrix shows that violence co-occurs with nearly every other category. Click the violence row and the word frequencies shift to "kill," "destroy," "war." Sexual content barely touches violence. These categories live in different neighborhoods — visible across all three datasets.

**Word distributions reveal category boundaries.** Click a word in the frequency strip and the breakdown panel shows how that word distributes across categories. The proportional bars make cross-category signatures immediately comparable.

**Rare combinations are the most informative.** The surprise metric sorts prompts by the rarity of their category combination. Edge cases reveal where category boundaries blur and where annotators were forced to make judgment calls across multiple dimensions simultaneously.

**The binary matrix shows population structure.** Each row of data becomes a thin strip of dark and light cells. Vertical dark bands show which categories dominate; horizontal patterns reveal clusters; scattered dark cells mark outliers. BeaverTails renders 300K rows at full density.

**Cross-dataset comparison reveals taxonomy design choices.** The Rosetta Stone table maps ~20 harm concepts across all five datasets, showing how "privacy" becomes "PII/privacy" in Aegis, or how "minors" is split from "sexual" in some taxonomies but merged in others. The Drift timeline shows this evolution chronologically — bold entries mark concepts appearing for the first time.

**Annotators disagree more than you'd expect.** The Split Verdict chart (SafeRLHF) shows that two independently classified responses disagree 8% of the time on privacy, but only 1% on trafficking. The safer response is not the better one 24% of the time. For Aegis, human labels agree perfectly while LLM jury labels diverge 36% between prompt and response safety.

**Same prompt, different labels.** 6,640 prompts appear in two or more datasets. The Doppelganger feature marks these in the results table — click to see how each taxonomy classified the identical text. The Consensus chart summarizes concept-level agreement: hate and privacy get 60%+ agreement across datasets, while toxicity and harassment get 0% (concepts that only some datasets track).

## Design

The visualizations apply Tufte's principles throughout: high data-ink ratio, direct labeling, small multiples, data-text integration, grayscale palette, and zero external dependencies. Every chart is rendered in purpose-built canvas code with no frameworks. All visualizations adapt their sizing, font, and layout automatically for 6 to 23 categories.

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
  jigsaw.json           32,450 rows (13 MB)
  openai.json           1,680 rows (1.2 MB)
  beavertails.json      300,567 rows (51 MB)
  saferlhf.json         38,640 rows (26 MB, includes divergence fields)
  aegis.json            29,095 rows (14 MB, includes divergence fields)
  *.js                  JS wrappers for file:// protocol
scripts/
  preprocess.py         One-time HuggingFace → JSON pipeline + stats + xref
```
