# Explore-wrongthink

## What is Explore-wrongthink?

Explore-wrongthink (EW) is a suite of tools for visualizing and analyzing training data sets that AI researchers and providers use to teach LLMs what is "harmful" speech.

Of course, terms like "harm" and "safety" are vague, so EW allows you to examine specific prompt examples that fit zero or more of eight categories:

| Category | Label | Definition |
| -------- | ----- | ---------- |
| sexual   | `S`   | Content meant to arouse sexual excitement, such as the description of sexual activity, or that promotes sexual services (excluding sex education and wellness). |
| hate     | `H`   | Content that expresses, incites, or promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste. |
| violence | `V`   | Content that promotes or glorifies violence or celebrates the suffering or humiliation of others. |
| harassment       | `HR`   | Content that may be used to torment or annoy individuals in real life, or make harassment more likely to occur. |
| self-harm        | `SH`   | Content that promotes, encourages, or depicts acts of self-harm, such as suicide, cutting, and eating disorders. |
| sexual/minors    | `S3`   | Sexual content that includes an individual who is under 18 years old. |
| hate/threatening | `H2`   | Hateful content that also includes violence or serious harm towards the targeted group. |
| violence/graphic | `V2`   | Violent content that depicts death, violence, or serious physical injury in extreme graphic detail. |

**Content warning**: shocking text.

## Where does the data come from?

In its first version, EW uses data from the 2022 paper ["A Holistic Approach to Undesired Content Detection in the Real World"](https://arxiv.org/abs/2208.03274). Specifically, I use the prompts and classifications from OpenAI's [moderation-api-release](https://github.com/openai/moderation-api-release/tree/main).

Future versions of EW should be able to compare and contrast different datasets. If you have data to share that would be helpful towards this end, please get in touch.

## How do I use explore-wrongthink?

### Subset generator
First convert the moderation dataset to `dataset.js`:
```
python scripts/jsonl_to_js.py --input samples-1680.jsonl --output dataset.js
```
Then open `subset-client.html` in your web browser. Select your desired values—results update automatically whenever you change a classification option. Use the search box at the top to filter prompts by keyword. For example, an input of "V" (violence) + "SH" (self-harm) parameters as 1, with all others being 0, gives two prompts:

![Screenshot of violence+self-harm combination subset of prompts.](EW_example_V+SH.png "Results update automatically when you change classifications")

*(Screenshot from an older version of the UI; the interface has since changed slightly.)*

The client page now includes visualizations rendered with Chart.js. After generating `dataset.js`, open the page to see bar charts of single-category counts, a heatmap of pairwise co-occurrences, and a histogram of key combinations. The chart on the left counts prompts for each single category, the heatmap in the middle shows how often pairs of categories appear together (brighter squares indicate more co-occurrences), and the histogram on the right counts how frequently each set of category keys occurs.

![Charts of single-category counts, pairwise co-occurrences, and key combination frequencies.](category-graphs.png "Single-category counts, pairwise co-occurrences, and key combination frequencies")

If the charts do not appear, check the browser console for error messages.

## What is EW's technology stack?

EW relies mostly on a few simple Python scripts. The subset generator is a static HTML page powered by JavaScript and Chart.js.

## Roadmap/wishlist

### Subset generator
* Client-side Javascript version that does not require Python (done)
* Add more options: "N/A" ? "1 or N/A" ? Better way to organize them?
* Predictions and suggestions: if you select one key, which others will likely return results?