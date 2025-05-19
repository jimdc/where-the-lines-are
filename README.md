# Explore-wrongthink

## What is Explore-wrongthink?

Explore-wrongthink (EW) is a toolset for visualizing and analyzing prompt-classification datasets used in language model safety research.

It allows users to examine prompt examples that fall into zero or more of eight categories:

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

Open `index.html` in your web browser. Select your desired values—results update automatically whenever you change a classification option. Use the search box at the top to filter prompts by keyword. For example, an input of "V" (violence) + "SH" (self-harm) parameters as 1, with all others being 0, gives two prompts:

![Screenshot of current search interface.](EW-bone+v+v2-search-example.png "Results update automatically when you change classifications")

*(Screenshot from the current UI.)*

The chart on the left counts prompts for each single category, the heatmap in the middle shows how often pairs of categories appear together (brighter squares indicate more co-occurrences), and the histogram on the right counts how frequently each set of category keys occurs.

![Charts of single-category counts, pairwise co-occurrences, and key combination frequencies.](category-graphs.png "Single-category counts, pairwise co-occurrences, and key combination frequencies")

If the charts do not appear, check the browser console for error messages.

If you open `index.html` directly from your filesystem and the page is stuck on
"Loading dataset...", your browser is blocking local file requests. Serve the
directory with a small web server (for example `python3 -m http.server`) and
then open `http://localhost:8000/` (or the port shown) in your browser, or use
GitHub Pages to view the site. Using a regular HTTP(S) URL avoids the
file-protocol restrictions that would otherwise keep "Loading dataset..." on the
screen.

The page also shows loading debug messages directly below the spinner. These now
include numbered steps (1–5) describing each part of the loading process. If the
dataset fails to load, these messages will show exactly which step failed along
with HTTP status codes and other details to help diagnose the problem.