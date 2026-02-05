# Explore-wrongthink

**Content warning**: this tool displays real-world text that was flagged as harmful. Expect shocking language.

## What is this?

Explore-wrongthink is a visualization tool for studying how content moderation categories overlap, co-occur, and cluster in real prompt data. It treats a classification dataset not as a lookup table but as a structure worth seeing — a place where patterns in how humans produce harmful text become visible through careful graphic design.

The interface follows Edward Tufte's principles from *The Visual Display of Quantitative Information*: maximize data density, eliminate chartjunk, label everything directly, and let the data speak through its structure rather than through decoration. Every pixel either carries data or gets out of the way.

## What can you discover?

The eight moderation categories are not independent. The visualizations expose their hidden geometry:

**Some categories never travel alone.** The exclusivity chart reveals that sexual/minors, hate/threatening, and violence/graphic are *never* flagged in isolation — they appear only when a parent category (sexual, hate, or violence) is also flagged. Self-harm, by contrast, is 92% exclusive: almost every self-harm prompt is *only* about self-harm. This tells you something about the taxonomy itself — the subcategories are strict refinements, while self-harm occupies its own semantic space.

**Violence is the connective tissue of harm.** The co-occurrence matrix shows that violence co-occurs with nearly every other category: 40 prompts share violence + hate, 37 share violence + hate/threatening, 24 share violence + violence/graphic. Click the violence row and the word frequencies shift to "kill," "destroy," "war" — words that bridge hate speech into threatened action. Sexual content, meanwhile, barely touches violence (8 co-occurrences) or hate (2). These categories live in different neighborhoods.

**Word distributions reveal category boundaries.** Click "kill" in the word frequency strip and the breakdown panel shows it appears in 27 prompts — 100% flagged for violence, 67% for hate, 63% for hate/threatening, but only 4% for sexual. Click "fuck" and the profile inverts: it spreads across sexual, harassment, and hate roughly equally. The proportional bars make these signatures immediately comparable.

**Rare combinations are the most informative.** The surprise metric sorts prompts by the rarity of their category combination. The most surprising prompts — those flagged "unique" — carry combinations like hate + violence + hate/threatening + violence/graphic that appear nowhere else in the dataset. These edge cases reveal where the category boundaries blur and where annotators were forced to make judgment calls across multiple dimensions simultaneously.

**The binary matrix shows population structure.** The prompt bitmap renders every row of data as a thin strip of dark and light cells. Viewed in aggregate, vertical dark bands show which categories dominate; horizontal patterns reveal clusters of similarly-classified prompts; and scattered dark cells in otherwise light rows mark the outliers. It is 2,400 data points in a glance — the kind of density that makes large-N patterns visible without summarization.

## Where does the data come from?

The dataset comes from the 2022 paper ["A Holistic Approach to Undesired Content Detection in the Real World"](https://arxiv.org/abs/2208.03274), specifically the prompts and classifications from OpenAI's [moderation-api-release](https://github.com/openai/moderation-api-release/tree/main). It contains 1,680 prompts classified across 8 categories.

Future versions should be able to compare and contrast different classification datasets. If you have data to share, please get in touch.

## Design

The visualizations apply Tufte's principles throughout: high data-ink ratio, direct labeling, small multiples, data-text integration, grayscale palette, and zero external dependencies. Every chart is rendered in purpose-built canvas code with no frameworks.

See [principles.md](principles.md) for the full design rationale with specific Tufte page citations.

## Usage

Open `index.html` in a browser. Everything updates reactively — click a category, click a matrix cell, click a word, type a search, toggle a pill. No server required (though `python3 -m http.server` works if you prefer HTTP).
