# Design Principles

This visualization redesign applies principles from Edward Tufte's
*The Visual Display of Quantitative Information* (2001, 2nd edition).

## Data-Ink Ratio (pp. 91-106)

Every mark on a graphic should present new information. We removed colored
bar fills, background shading, and tooltip-only data. Counts are printed
directly on graphics as text — the same ink serves as both label and data
measure. The old Chart.js bar charts encoded each value six redundant ways
(bar height, bar color, bar border, axis tick, gridline, tooltip). The new
small multiples use exactly two: a thin bar and its count label.

Tufte's erasing principles (p. 96): "Erase non-data-ink, within reason"
and "Erase redundant data-ink, within reason."

## Chartjunk Elimination (pp. 107-122)

The word cloud was the most prominent piece of chartjunk — word size is a
poor quantitative encoding, layout is random, and color is purely decorative.
It has been replaced with a ranked dot plot where every element carries data.
Colored bar fills (rgba with opacity), animated spinners, and Bootstrap's
decorative borders have all been removed.

Tufte (p. 107): chartjunk is "non-data-ink or redundant data-ink."

## Small Multiples (pp. 170-175)

The single 8-bar category chart has been replaced with 8 individual panels
in a horizontal strip. Each shows one category's count as a thin bar with
a gray median reference line. This format is "inevitably comparative" and
"drawn almost entirely with data-ink" (p. 175).

Key quote (p. 175): "For non-data-ink, less is more. For data-ink, less
is a bore."

## Data Density (p. 168) and the Shrink Principle (p. 169)

Each visualization is compact: the co-occurrence matrix fits 56 data points
(28 unique pairs, mirrored) in roughly 300x300 pixels. The word frequency
strip shows 40 ranked entries in ~720px of vertical space. The combination
dot plot renders up to 30 rows in under 600px.

Tufte (p. 168): "Maximize data density and the size of the data matrix,
within reason."

## Data-Text Integration (pp. 180-182)

Charts are no longer hidden in a separate div. They flow as sections within
the page, preceded by explanatory text. A summary paragraph with inline
statistics ("1,680 prompts... most frequent: sexual content (n=237)")
integrates data directly into prose.

Tufte (p. 181): "Data graphics are paragraphs about data and should be
treated as such."

## Multifunctioning Elements (pp. 139-147)

In the co-occurrence matrix, cell shading encodes the co-occurrence count
while the count number printed inside each cell provides exact values.
The cell boundaries are defined by white gaps rather than drawn gridlines —
the absence of ink creates structure. Each element performs multiple roles.

Tufte (p. 139): "Mobilize every graphical element, perhaps several times
over, to show the data."

## Direct Labeling (pp. 183-184)

All values are labeled directly on the graphics. The small multiples show
counts next to bars. The dot plots show counts next to dots. The matrix
shows counts inside cells. There are no external legends, no color keys,
and no axis labels that require cross-referencing.

Tufte (p. 183): "Words are spelled out, mysterious and elaborate encoding
avoided."

## Grid Suppression (pp. 112-115)

No dark gridlines appear in any visualization. The co-occurrence matrix
uses white gaps between cells. The dot plots use faint reference lines
(0.5px, #e0e0e0) that recede behind the data. Table borders are reduced
to single faint bottom rules.

Tufte (p. 112): "Dark grid lines are chartjunk."

## Friendly Graphics (p. 183)

Tufte (p. 183): "Graphical elegance is often found in simplicity of design
and complexity of data." Friendly graphics spell out words, avoid mysterious
encoding, and tell the viewer how to read the display.

Phase 1 established serif typography and grayscale. Phase 2 extends
friendliness in three ways:

1. **Full category names.** Abbreviations (S, H, V, HR, SH, S3, H2, V2)
   are replaced everywhere with spelled-out names (sexual, hate, violence,
   harassment, self-harm, sexual/minors, hate/threatening, violence/graphic).
   The viewer no longer needs to memorize a code table.

2. **Instructional text.** Brief one-line prompts appear between sections:
   "Click a category to focus on it," "Darker cells = more co-occurrences.
   Click any cell." These follow Tufte's note that exploratory graphics
   benefit from words telling the viewer how to read the design.

3. **Category pills.** Tristate checkboxes (requiring knowledge of
   Any/Include/Exclude semantics) are replaced with pill-shaped buttons
   whose visual state IS the filter state: gray = any, filled = include,
   strikethrough = exclude. The same pill vocabulary appears inline in the
   results table, eliminating the need for hover-only classification data.

4. **Word-to-category breakdown.** Clicking a word in the frequency strip
   reveals a mini bar chart showing how that word distributes across
   categories. This replaces the previous behavior (search-only) with a
   richer cross-reference that encourages exploration.

Typography continues to use a serif face (Palatino/Georgia) for body text,
consistent with Tufte's preference for upper-and-lower case serif type.
Controls use system sans-serif for functional clarity. Text runs
left-to-right throughout. Color-deficient viewers are unaffected since
the palette is grayscale.

## Category Exclusivity (pp. 139, 168)

Phase 3 adds a stacked horizontal bar chart showing, for each category,
the split between prompts flagged exclusively for that category and prompts
that share the flag with other categories. The dark segment encodes exclusive
counts; the light segment encodes shared counts. Direct labels show
"N alone (P%) | M shared" after each bar.

This visualization serves two Tufte principles simultaneously:

- **Multifunctioning elements** (p. 139): the bar length encodes the total
  count, the dark/light split encodes exclusivity ratio, and the label
  provides exact values — three data readings from one graphic element.
- **Data density** (p. 168): eight categories × two segments each = 16 data
  points plus 16 numeric labels, all in ~200px of vertical space.

## Prompt Binary Matrix (pp. 168-169)

A dense canvas rendering where each row is one prompt and each column is one
of the eight categories. A dark cell means the category is flagged; a light
cell means it is not. The result is an 8-column binary data matrix that
reveals co-activation patterns at a glance: vertical dark stripes show
frequently flagged categories, horizontal clusters show prompts with similar
profiles, and sparse rows reveal unusual combinations.

This is a direct application of Tufte's data matrix and shrink principle:

Tufte (p. 168): "Maximize data density and the size of the data matrix,
within reason." At 8×3 pixels per cell, the matrix encodes 300 prompts ×
8 categories = 2,400 binary data points in under 80×1,200 pixels — a data
density exceeding 25 data points per square centimeter.

Tufte (p. 169): "Graphics can be shrunk way down." The 3px row height
eliminates all non-data space, letting pattern recognition operate at the
gestalt level rather than through sequential reading.

## Surprise Metric (p. 53)

The results table gains a "Surprise" column that quantifies how unusual each
prompt's category combination is relative to the full dataset. Surprise is
the inverse of combination frequency: a prompt whose exact category pattern
appears only once in the dataset scores highest ("unique"), while a prompt
sharing its pattern with hundreds of others scores lowest.

This follows Tufte's principle (p. 53) that good graphics should "reveal
the unexpected." In the default (unfiltered) view, prompts are sorted by
surprise descending so that the rarest combinations appear first. Each cell
contains a small inline bar (proportional to surprise score) and a text
label: "unique" for frequency 1, "rare (N)" for frequency 2–5, or just the
frequency number otherwise.

## Proportional Word-Category Breakdown (p. 139)

The word-category breakdown panel (shown when clicking a word in the
frequency strip) now encodes proportions rather than raw counts. Bar width
spans 0–100% of the matching prompts, and the label reads
"count/total (pct%)". This makes the bar a multifunctioning element:
its width encodes the proportion, its label provides the exact fraction,
and the percentage makes cross-category comparison immediate.

Tufte (p. 139): "Mobilize every graphical element, perhaps several times
over, to show the data."

## Zero External Dependencies

The redesign removes Chart.js (180KB), chartjs-chart-matrix (20KB),
wordcloud2.js (15KB), and Bootstrap (25KB CSS). All visualizations are
rendered with approximately 7KB of purpose-built canvas code. This follows
the principle that the technology should serve the data, not the reverse.
