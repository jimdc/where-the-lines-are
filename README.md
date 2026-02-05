# Explore-wrongthink

**Content warning**: this tool displays real-world text that was flagged as harmful. Expect shocking language.

## What is this?

Explore-wrongthink is a visualization tool for studying how content moderation categories overlap, co-occur, and cluster in real prompt data. It treats a classification dataset not as a lookup table but as a structure worth seeing — a place where patterns in how humans produce harmful text become visible through careful graphic design.

The interface follows Edward Tufte's principles from *The Visual Display of Quantitative Information*: maximize data density, eliminate chartjunk, label everything directly, and let the data speak through its structure rather than through decoration. Every pixel either carries data or gets out of the way.

## Datasets

Three datasets ship with the tool, each representing a different organization's approach to content moderation taxonomy:

| Dataset | Source | Year | Prompts | Categories | License |
|---------|--------|------|---------|-----------|---------|
| **OpenAI Moderation** | [OpenAI moderation-api-release](https://github.com/openai/moderation-api-release) | 2022 | 1,680 | 8 | MIT |
| **BeaverTails** | [PKU-Alignment](https://huggingface.co/datasets/PKU-Alignment/BeaverTails) | 2023 | 300,567 | 14 | CC-BY-NC-4.0 |
| **NVIDIA Aegis v2** | [NVIDIA](https://huggingface.co/datasets/nvidia/Aegis-AI-Content-Safety-Dataset-2.0) | 2024 | 29,095 | 23 | CC-BY-4.0 |

All three share the same multi-label binary structure (each prompt has one or more flagged categories) but slice content moderation differently. BeaverTails adds financial crime, terrorism, and privacy. Aegis adds profanity, criminal planning, PII, malware, and unauthorized advice. Self-harm appears in all three — compare exclusivity across taxonomies. Click a dataset panel at the top to switch; all visualizations rebuild from scratch.

## What can you discover?

Moderation categories are not independent. The visualizations expose their hidden geometry — differently for each dataset.

**Some categories never travel alone.** In the OpenAI dataset, the exclusivity chart reveals that sexual/minors, hate/threatening, and violence/graphic are *never* flagged in isolation — they appear only when a parent category is also flagged. Self-harm, by contrast, is 92% exclusive. Switch to BeaverTails and the exclusivity profile changes entirely: animal abuse is highly exclusive while discrimination is almost always shared.

**Violence is the connective tissue of harm.** The co-occurrence matrix shows that violence co-occurs with nearly every other category. Click the violence row and the word frequencies shift to "kill," "destroy," "war." Sexual content barely touches violence. These categories live in different neighborhoods — visible across all three datasets.

**Word distributions reveal category boundaries.** Click a word in the frequency strip and the breakdown panel shows how that word distributes across categories. The proportional bars make cross-category signatures immediately comparable.

**Rare combinations are the most informative.** The surprise metric sorts prompts by the rarity of their category combination. Edge cases reveal where category boundaries blur and where annotators were forced to make judgment calls across multiple dimensions simultaneously.

**The binary matrix shows population structure.** Each row of data becomes a thin strip of dark and light cells. Vertical dark bands show which categories dominate; horizontal patterns reveal clusters; scattered dark cells mark outliers. BeaverTails renders 300K rows at full density.

**Cross-dataset comparison reveals taxonomy design choices.** The same behavior may be classified differently across datasets. OpenAI uses 8 coarse categories; BeaverTails splits into 14 including "controversial topics/politics"; Aegis uses 23 fine-grained categories including "needs caution" and "unauthorized advice." Switching between datasets makes these design choices visible through the same set of visualizations.

## Design

The visualizations apply Tufte's principles throughout: high data-ink ratio, direct labeling, small multiples, data-text integration, grayscale palette, and zero external dependencies. Every chart is rendered in purpose-built canvas code with no frameworks. All visualizations adapt their sizing, font, and layout automatically for 8, 14, or 23 categories.

See [principles.md](principles.md) for the full design rationale with specific Tufte page citations.

## Usage

Open `index.html` in a browser. Everything updates reactively — click a category, click a matrix cell, click a word, type a search, toggle a pill. No server required for the OpenAI dataset (works via `file://`), though `python3 -m http.server` is recommended to load BeaverTails and Aegis (51MB and 13MB respectively). A service worker caches datasets after first load for offline use.

## File structure

```
index.html              Main page
dataset-loader.js       Registry + dataset loading (file:// and HTTP)
static/vis.js           All canvas visualizations
static/styles.css       Tufte-inspired stylesheet
datasets/
  registry.json         Dataset manifest with schemas
  openai.json           1,680 rows (1.2 MB)
  beavertails.json      300,567 rows (51 MB)
  aegis.json            29,095 rows (13 MB)
  *.js                  JS wrappers for file:// protocol
scripts/
  preprocess.py         One-time HuggingFace → JSON pipeline
```
