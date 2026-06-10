var datasetRegistry = {
  "datasets": [
    {
      "id": "jigsaw",
      "name": "Jigsaw Toxic Comments",
      "source": "Google Jigsaw (2018)",
      "license": "CC0",
      "paper": "https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge",
      "repo": "https://huggingface.co/datasets/Arsive/toxicity_classification_jigsaw",
      "file": "datasets/jigsaw.json",
      "fileJs": "datasets/jigsaw.js",
      "textField": "comment",
      "note": "160K Wikipedia talk page comments classified across 6 toxicity categories. The founding multi-label content moderation dataset.",
      "categories": [
        {
          "key": "TX",
          "name": "toxic",
          "short": "toxic",
          "definition": "Comments that are rude, disrespectful, or otherwise likely to make someone leave a discussion.",
          "concept": "toxicity"
        },
        {
          "key": "ST",
          "name": "severe toxic",
          "short": "severe toxic",
          "definition": "Comments that are very hateful, aggressive, or disrespectful to an extreme degree.",
          "concept": "toxicity"
        },
        {
          "key": "OB",
          "name": "obscene",
          "short": "obscene",
          "definition": "Comments containing obscene or vulgar language.",
          "concept": "toxicity"
        },
        {
          "key": "TH",
          "name": "threat",
          "short": "threat",
          "definition": "Comments containing threats of violence or harm.",
          "concept": "violence"
        },
        {
          "key": "IN",
          "name": "insult",
          "short": "insult",
          "definition": "Comments intended to insult or demean someone.",
          "concept": "hate"
        },
        {
          "key": "IH",
          "name": "identity hate",
          "short": "identity hate",
          "definition": "Comments that express hatred toward a person based on identity (race, religion, gender, etc.).",
          "concept": "hate"
        }
      ],
      "stats": {
        "totalRows": 32450,
        "categoryCounts": {
          "TX": 15267,
          "ST": 1618,
          "OB": 8457,
          "TH": 461,
          "IN": 7904,
          "IH": 1386
        },
        "exclusivityRatios": {
          "TX": 0.369,
          "ST": 0.0,
          "OB": 0.037,
          "TH": 0.041,
          "IN": 0.04,
          "IH": 0.039
        },
        "avgExclusivity": 0.088,
        "multiLabelRate": 0.304
      }
    },
    {
      "id": "openai",
      "name": "OpenAI Moderation",
      "source": "OpenAI moderation-api-release (2022)",
      "license": "MIT",
      "paper": "https://arxiv.org/abs/2208.03274",
      "repo": "https://github.com/openai/moderation-api-release",
      "file": "datasets/openai.json",
      "fileJs": "datasets/openai.js",
      "textField": "prompt",
      "categories": [
        {
          "key": "S",
          "name": "sexual content",
          "short": "sexual",
          "definition": "Content meant to arouse sexual excitement, such as the description of sexual activity, or that promotes sexual services (excluding sex education and wellness).",
          "concept": "sexual"
        },
        {
          "key": "H",
          "name": "hate speech",
          "short": "hate",
          "definition": "Content that expresses, incites, or promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste.",
          "concept": "hate"
        },
        {
          "key": "V",
          "name": "violence",
          "short": "violence",
          "definition": "Content that promotes or glorifies violence or celebrates the suffering or humiliation of others.",
          "concept": "violence"
        },
        {
          "key": "HR",
          "name": "harassment",
          "short": "harassment",
          "definition": "Content that may be used to torment or annoy individuals in real life, or make harassment more likely to occur.",
          "concept": "harassment"
        },
        {
          "key": "SH",
          "name": "self-harm",
          "short": "self-harm",
          "definition": "Content that promotes, encourages, or depicts acts of self-harm, such as suicide, cutting, and eating disorders.",
          "concept": "self-harm"
        },
        {
          "key": "S3",
          "name": "sexual/minors",
          "short": "sexual/minors",
          "definition": "Sexual content that includes an individual who is under 18 years old.",
          "concept": [
            "sexual",
            "minors"
          ]
        },
        {
          "key": "H2",
          "name": "hate/threatening",
          "short": "hate/threat.",
          "definition": "Hateful content that also includes violence or serious harm towards the targeted group.",
          "concept": [
            "hate",
            "violence"
          ]
        },
        {
          "key": "V2",
          "name": "violence/graphic",
          "short": "violence/graphic",
          "definition": "Violent content that depicts death, violence, or serious physical injury in extreme graphic detail.",
          "concept": "violence"
        }
      ],
      "stats": {
        "totalRows": 1680,
        "categoryCounts": {
          "S": 237,
          "H": 162,
          "V": 94,
          "HR": 76,
          "SH": 51,
          "S3": 85,
          "H2": 41,
          "V2": 24
        },
        "exclusivityRatios": {
          "S": 0.595,
          "H": 0.593,
          "V": 0.234,
          "HR": 0.421,
          "SH": 0.922,
          "S3": 0.0,
          "H2": 0.0,
          "V2": 0.0
        },
        "avgExclusivity": 0.346,
        "multiLabelRate": 0.11
      }
    },
    {
      "id": "beavertails",
      "name": "BeaverTails",
      "source": "PKU-Alignment (2023)",
      "license": "CC-BY-NC-4.0",
      "paper": "https://arxiv.org/abs/2307.04657",
      "repo": "https://huggingface.co/datasets/PKU-Alignment/BeaverTails",
      "file": "datasets/beavertails.json",
      "fileJs": "datasets/beavertails.js",
      "textField": "prompt",
      "note": "330K prompt-response pairs classified across 14 harm categories by PKU.",
      "categories": [
        {
          "key": "AA",
          "name": "animal abuse",
          "short": "animal abuse",
          "definition": "Content that promotes or depicts cruelty, harm, or neglect toward animals.",
          "concept": "animal"
        },
        {
          "key": "CA",
          "name": "child abuse",
          "short": "child abuse",
          "definition": "Content involving harm, exploitation, or endangerment of minors.",
          "concept": "minors"
        },
        {
          "key": "CT",
          "name": "controversial topics/politics",
          "short": "politics",
          "definition": "Content involving divisive political, social, or ideological topics.",
          "concept": "politics"
        },
        {
          "key": "DS",
          "name": "discrimination/stereotype",
          "short": "discrimination",
          "definition": "Content that promotes discrimination, stereotypes, or injustice based on group identity.",
          "concept": "hate"
        },
        {
          "key": "DW",
          "name": "drug abuse/weapons",
          "short": "drugs/weapons",
          "definition": "Content promoting drug abuse, weapons, or banned substances.",
          "concept": "substances"
        },
        {
          "key": "FC",
          "name": "financial crime/theft",
          "short": "financial crime",
          "definition": "Content related to financial crimes, property crimes, or theft.",
          "concept": "fraud"
        },
        {
          "key": "HS",
          "name": "hate speech/offensive",
          "short": "hate/offense",
          "definition": "Content containing hate speech or offensive language targeting groups or individuals.",
          "concept": "hate"
        },
        {
          "key": "ME",
          "name": "misinformation",
          "short": "misinfo",
          "definition": "Misinformation regarding ethics, laws, and safety topics.",
          "concept": "misinfo"
        },
        {
          "key": "NV",
          "name": "non-violent unethical behavior",
          "short": "unethical",
          "definition": "Content promoting unethical behavior that does not involve physical violence.",
          "concept": "manipulation"
        },
        {
          "key": "PV",
          "name": "privacy violation",
          "short": "privacy",
          "definition": "Content that violates or encourages violation of personal privacy.",
          "concept": "privacy"
        },
        {
          "key": "SH",
          "name": "self-harm",
          "short": "self-harm",
          "definition": "Content that promotes, encourages, or depicts acts of self-harm.",
          "concept": "self-harm"
        },
        {
          "key": "SE",
          "name": "sexually explicit/adult",
          "short": "sexual",
          "definition": "Sexually explicit or adult content.",
          "concept": "sexual"
        },
        {
          "key": "TC",
          "name": "terrorism/organized crime",
          "short": "terrorism",
          "definition": "Content related to terrorism or organized criminal activities.",
          "concept": "terrorism"
        },
        {
          "key": "VI",
          "name": "violence/incitement",
          "short": "violence",
          "definition": "Content that promotes violence, aiding and abetting, or incitement to violence.",
          "concept": "violence"
        }
      ],
      "stats": {
        "totalRows": 300567,
        "categoryCounts": {
          "AA": 3480,
          "CA": 1664,
          "CT": 9233,
          "DS": 24006,
          "DW": 16724,
          "FC": 28769,
          "HS": 27127,
          "ME": 3835,
          "NV": 59992,
          "PV": 14774,
          "SH": 2024,
          "SE": 6876,
          "TC": 2457,
          "VI": 79544
        },
        "exclusivityRatios": {
          "AA": 0.187,
          "CA": 0.087,
          "CT": 0.862,
          "DS": 0.075,
          "DW": 0.076,
          "FC": 0.045,
          "HS": 0.053,
          "ME": 0.63,
          "NV": 0.295,
          "PV": 0.685,
          "SH": 0.497,
          "SE": 0.437,
          "TC": 0.05,
          "VI": 0.33
        },
        "avgExclusivity": 0.308,
        "multiLabelRate": 0.304
      }
    },
    {
      "id": "saferlhf",
      "name": "PKU-SafeRLHF",
      "source": "PKU-Alignment (2024)",
      "license": "CC-BY-NC-4.0",
      "paper": "https://arxiv.org/abs/2406.15513",
      "repo": "https://huggingface.co/datasets/PKU-Alignment/PKU-SafeRLHF",
      "file": "datasets/saferlhf.json",
      "fileJs": "datasets/saferlhf.js",
      "textField": "prompt",
      "note": "265K preference pairs with 19 harm categories and 3-level severity. Extends BeaverTails with cybercrime, mental manipulation, and environmental damage.",
      "categories": [
        {
          "key": "AB",
          "name": "animal abuse",
          "short": "animal abuse",
          "definition": "Content that promotes or depicts cruelty, harm, or neglect toward animals.",
          "concept": "animal"
        },
        {
          "key": "CC",
          "name": "cybercrime",
          "short": "cybercrime",
          "definition": "Content related to hacking, phishing, malware, or other computer-based crimes.",
          "concept": "cyber"
        },
        {
          "key": "CI",
          "name": "copyright issues",
          "short": "copyright",
          "definition": "Content involving copyright infringement or intellectual property violations.",
          "concept": "copyright"
        },
        {
          "key": "DB",
          "name": "discriminatory behavior",
          "short": "discrimination",
          "definition": "Content promoting discrimination based on identity characteristics.",
          "concept": "hate"
        },
        {
          "key": "DR",
          "name": "drugs",
          "short": "drugs",
          "definition": "Content promoting drug use or production of controlled substances.",
          "concept": "substances"
        },
        {
          "key": "EC",
          "name": "economic crime",
          "short": "econ. crime",
          "definition": "Content related to fraud, embezzlement, or financial crimes.",
          "concept": "fraud"
        },
        {
          "key": "ED",
          "name": "environmental damage",
          "short": "environment",
          "definition": "Content promoting or facilitating environmental harm or pollution.",
          "concept": "environment"
        },
        {
          "key": "HT",
          "name": "human trafficking",
          "short": "trafficking",
          "definition": "Content related to human trafficking, forced labor, or modern slavery.",
          "concept": "trafficking"
        },
        {
          "key": "IB",
          "name": "insulting behavior",
          "short": "insults",
          "definition": "Content intended to insult, demean, or belittle individuals.",
          "concept": "hate"
        },
        {
          "key": "MM",
          "name": "mental manipulation",
          "short": "manipulation",
          "definition": "Content designed to psychologically manipulate, gaslight, or coerce people.",
          "concept": "manipulation"
        },
        {
          "key": "NS",
          "name": "endangering national security",
          "short": "nat. security",
          "definition": "Content that threatens national security or promotes espionage.",
          "concept": "terrorism"
        },
        {
          "key": "PH",
          "name": "endangering public health",
          "short": "pub. health",
          "definition": "Content that endangers public health through misinformation or harmful advice.",
          "concept": "misinfo"
        },
        {
          "key": "PO",
          "name": "disrupting public order",
          "short": "pub. order",
          "definition": "Content that promotes disruption of public order or civil unrest.",
          "concept": "politics"
        },
        {
          "key": "PS",
          "name": "psychological harm",
          "short": "psych. harm",
          "definition": "Content that causes or promotes psychological distress, trauma, or emotional harm.",
          "concept": "self-harm"
        },
        {
          "key": "PV",
          "name": "privacy violation",
          "short": "privacy",
          "definition": "Content that violates or encourages violation of personal privacy.",
          "concept": "privacy"
        },
        {
          "key": "PY",
          "name": "physical harm",
          "short": "physical harm",
          "definition": "Content that promotes or facilitates physical harm to individuals.",
          "concept": "violence"
        },
        {
          "key": "SX",
          "name": "sexual content",
          "short": "sexual",
          "definition": "Sexually explicit or suggestive content.",
          "concept": "sexual"
        },
        {
          "key": "VL",
          "name": "violence",
          "short": "violence",
          "definition": "Content depicting or promoting violence.",
          "concept": "violence"
        },
        {
          "key": "WC",
          "name": "white-collar crime",
          "short": "white-collar",
          "definition": "Content related to corporate fraud, insider trading, or business-related crimes.",
          "concept": "fraud"
        }
      ],
      "stats": {
        "totalRows": 38640,
        "categoryCounts": {
          "AB": 577,
          "CC": 7992,
          "CI": 863,
          "DB": 1575,
          "DR": 2190,
          "EC": 6126,
          "ED": 531,
          "HT": 1497,
          "IB": 3294,
          "MM": 5182,
          "NS": 2240,
          "PH": 817,
          "PO": 1951,
          "PS": 4519,
          "PV": 6913,
          "PY": 3933,
          "SX": 809,
          "VL": 3272,
          "WC": 3304
        },
        "exclusivityRatios": {
          "AB": 0.289,
          "CC": 0.041,
          "CI": 0.465,
          "DB": 0.233,
          "DR": 0.157,
          "EC": 0.043,
          "ED": 0.175,
          "HT": 0.123,
          "IB": 0.103,
          "MM": 0.236,
          "NS": 0.036,
          "PH": 0.104,
          "PO": 0.08,
          "PS": 0.004,
          "PV": 0.106,
          "PY": 0.032,
          "SX": 0.153,
          "VL": 0.036,
          "WC": 0.029
        },
        "avgExclusivity": 0.129,
        "multiLabelRate": 0.455
      }
    },
    {
      "id": "aegis",
      "name": "NVIDIA Aegis v2",
      "source": "NVIDIA (2024)",
      "license": "CC-BY-4.0",
      "paper": "https://arxiv.org/abs/2404.05993",
      "repo": "https://huggingface.co/datasets/nvidia/Aegis-AI-Content-Safety-Dataset-2.0",
      "file": "datasets/aegis.json",
      "fileJs": "datasets/aegis.js",
      "textField": "prompt",
      "note": "29K human-annotated prompt-response pairs across 23 safety categories.",
      "categories": [
        {
          "key": "CO",
          "name": "copyright/trademark/plagiarism",
          "short": "copyright",
          "definition": "Content involving copyright infringement, trademark violations, or plagiarism.",
          "concept": "copyright"
        },
        {
          "key": "CP",
          "name": "criminal planning/confessions",
          "short": "criminal plan.",
          "definition": "Content involving planning or confessing to criminal activities.",
          "concept": "cyber"
        },
        {
          "key": "CS",
          "name": "controlled/regulated substances",
          "short": "substances",
          "definition": "Content related to controlled or regulated substances.",
          "concept": "substances"
        },
        {
          "key": "FD",
          "name": "fraud/deception",
          "short": "fraud",
          "definition": "Content involving fraudulent schemes or deceptive practices.",
          "concept": "fraud"
        },
        {
          "key": "GV",
          "name": "high-risk gov. decisions",
          "short": "gov. decisions",
          "definition": "Content related to high-risk government decision-making processes.",
          "concept": "politics"
        },
        {
          "key": "GW",
          "name": "guns/illegal weapons",
          "short": "guns/weapons",
          "definition": "Content related to guns and illegal weapons.",
          "concept": "substances"
        },
        {
          "key": "HA",
          "name": "harassment",
          "short": "harassment",
          "definition": "Content intended to harass, bully, or intimidate individuals.",
          "concept": "harassment"
        },
        {
          "key": "HI",
          "name": "hate/identity hate",
          "short": "hate",
          "definition": "Content expressing hate based on identity characteristics.",
          "concept": "hate"
        },
        {
          "key": "IA",
          "name": "illegal activity",
          "short": "illegal act.",
          "definition": "Content promoting or describing general illegal activities.",
          "concept": "cyber"
        },
        {
          "key": "IU",
          "name": "immoral/unethical",
          "short": "unethical",
          "definition": "Content promoting immoral or unethical behavior.",
          "concept": "manipulation"
        },
        {
          "key": "MN",
          "name": "manipulation",
          "short": "manipulation",
          "definition": "Content designed to manipulate or deceive people.",
          "concept": "manipulation"
        },
        {
          "key": "MW",
          "name": "malware",
          "short": "malware",
          "definition": "Content related to creating or distributing malicious software.",
          "concept": "cyber"
        },
        {
          "key": "NC",
          "name": "needs caution",
          "short": "caution",
          "definition": "Content that requires careful handling but may not be explicitly harmful.",
          "concept": "other"
        },
        {
          "key": "OT",
          "name": "other",
          "short": "other",
          "definition": "Content flagged for safety concerns not covered by other categories.",
          "concept": "other"
        },
        {
          "key": "PF",
          "name": "profanity",
          "short": "profanity",
          "definition": "Content containing profane or vulgar language.",
          "concept": "toxicity"
        },
        {
          "key": "PI",
          "name": "PII/privacy",
          "short": "PII/privacy",
          "definition": "Content involving personally identifiable information or privacy violations.",
          "concept": "privacy"
        },
        {
          "key": "PM",
          "name": "political/misinfo/conspiracy",
          "short": "misinfo",
          "definition": "Content involving political misinformation or conspiracy theories.",
          "concept": "misinfo"
        },
        {
          "key": "SM",
          "name": "sexual (minor)",
          "short": "sexual/minor",
          "definition": "Sexual content involving minors.",
          "concept": [
            "sexual",
            "minors"
          ]
        },
        {
          "key": "SS",
          "name": "suicide/self-harm",
          "short": "self-harm",
          "definition": "Content related to suicide or self-harm.",
          "concept": "self-harm"
        },
        {
          "key": "SX",
          "name": "sexual",
          "short": "sexual",
          "definition": "Sexually explicit or suggestive content.",
          "concept": "sexual"
        },
        {
          "key": "TH",
          "name": "threat",
          "short": "threat",
          "definition": "Content containing threats of violence or harm.",
          "concept": "violence"
        },
        {
          "key": "UA",
          "name": "unauthorized advice",
          "short": "unauth. advice",
          "definition": "Content providing unauthorized professional advice (legal, medical, financial).",
          "concept": "other"
        },
        {
          "key": "VL",
          "name": "violence",
          "short": "violence",
          "definition": "Content depicting or promoting violence.",
          "concept": "violence"
        }
      ],
      "stats": {
        "totalRows": 29095,
        "categoryCounts": {
          "CO": 94,
          "CP": 7725,
          "CS": 1599,
          "FD": 426,
          "GV": 90,
          "GW": 1122,
          "HA": 2740,
          "HI": 2945,
          "IA": 216,
          "IU": 265,
          "MN": 7,
          "MW": 166,
          "NC": 3578,
          "OT": 318,
          "PF": 1792,
          "PI": 1627,
          "PM": 468,
          "SM": 268,
          "SS": 565,
          "SX": 1724,
          "TH": 205,
          "UA": 549,
          "VL": 2990
        },
        "exclusivityRatios": {
          "CO": 0.468,
          "CP": 0.369,
          "CS": 0.23,
          "FD": 0.239,
          "GV": 0.222,
          "GW": 0.139,
          "HA": 0.303,
          "HI": 0.387,
          "IA": 0.051,
          "IU": 0.075,
          "MN": 0.0,
          "MW": 0.259,
          "NC": 0.543,
          "OT": 0.003,
          "PF": 0.262,
          "PI": 0.677,
          "PM": 0.331,
          "SM": 0.101,
          "SS": 0.389,
          "SX": 0.35,
          "TH": 0.083,
          "UA": 0.829,
          "VL": 0.13
        },
        "avgExclusivity": 0.28,
        "multiLabelRate": 0.295
      }
    },
    {
      "id": "airbench",
      "name": "AIR-Bench 2024",
      "source": "Stanford CRFM (2024)",
      "license": "CC-BY-4.0",
      "paper": "https://arxiv.org/abs/2407.17436",
      "repo": "https://huggingface.co/datasets/stanford-crfm/air-bench-2024",
      "file": "datasets/airbench.json",
      "fileJs": "datasets/airbench.js",
      "textField": "prompt",
      "note": "5,694 prompts derived from 8 government regulations and 16 company policies (incl. Anthropic and OpenAI), organized in a 4-level AI-risk taxonomy (4\u219216\u219245\u2192314). Rolled up here to the 16 Level-2 categories. Single-label at the leaf, so co-occurrence is near-diagonal by design \u2014 AIR-Bench\u2019s contribution is taxonomic breadth, notably the CBRN/biosecurity and cyber axes absent from the other five datasets.",
      "categories": [
        {
          "key": "CH",
          "name": "child harm",
          "short": "child harm",
          "concept": "minors",
          "definition": "Content sexualizing, endangering, harming, or abusing minors (AIR L2 \u201cChild Harm\u201d: child sexual abuse; endangerment, harm, or abuse of children)."
        },
        {
          "key": "CR",
          "name": "criminal activities",
          "short": "criminal",
          "concept": [
            "substances",
            "trafficking"
          ],
          "definition": "Facilitating crime \u2014 illegal/regulated substances and goods (drugs), human trafficking, prostitution, sexual exploitation, and other unlawful activity (AIR L2 \u201cCriminal Activities\u201d)."
        },
        {
          "key": "DC",
          "name": "deception",
          "short": "deception",
          "concept": [
            "fraud",
            "misinfo"
          ],
          "definition": "Fraud (phishing, scams, impersonation), academic dishonesty, and mis/disinformation (AIR L2 \u201cDeception\u201d)."
        },
        {
          "key": "DF",
          "name": "defamation",
          "short": "defamation",
          "concept": "other",
          "definition": "Generating defamatory content that damages reputation through false statements of fact (AIR L2 \u201cDefamation\u201d)."
        },
        {
          "key": "DB",
          "name": "discrimination/bias",
          "short": "discrimination",
          "concept": "hate",
          "definition": "Discrimination or bias against protected characteristics (AIR L2 \u201cDiscrimination/Bias\u201d; 60 protected-characteristic combinations)."
        },
        {
          "key": "EH",
          "name": "economic harm",
          "short": "economic harm",
          "concept": "fraud",
          "definition": "Economic harms \u2014 disempowering workers, high-risk financial activities, pyramid/MLM schemes, and unfair market practices (AIR L2 \u201cEconomic Harm\u201d)."
        },
        {
          "key": "FR",
          "name": "fundamental rights",
          "short": "fund. rights",
          "concept": "copyright",
          "definition": "Violating personal and intellectual-property rights \u2014 honor, name, portrait, reputation, and IP/trade-secret rights (AIR L2 \u201cFundamental Rights\u201d)."
        },
        {
          "key": "HT",
          "name": "hate/toxicity",
          "short": "hate/toxicity",
          "concept": [
            "hate",
            "toxicity",
            "harassment"
          ],
          "definition": "Hate speech, harassment, offensive language, and perpetuating harmful beliefs (AIR L2 \u201cHate/Toxicity\u201d)."
        },
        {
          "key": "MN",
          "name": "manipulation",
          "short": "manipulation",
          "concept": "manipulation",
          "definition": "Manipulating people through misrepresentation (impersonating humans, undisclosed AI-generated content) and sowing division (AIR L2 \u201cManipulation\u201d)."
        },
        {
          "key": "OM",
          "name": "operational misuses",
          "short": "operational",
          "concept": "other",
          "definition": "Unsafe operational uses \u2014 advice in heavily regulated industries, automated decision-making, and autonomous unsafe operation of critical systems (AIR L2 \u201cOperational Misuses\u201d)."
        },
        {
          "key": "PU",
          "name": "political usage",
          "short": "political",
          "concept": "politics",
          "definition": "Political uses \u2014 deterring democratic participation, influencing politics, political persuasion, and disrupting social order (AIR L2 \u201cPolitical Usage\u201d)."
        },
        {
          "key": "PR",
          "name": "privacy",
          "short": "privacy",
          "concept": "privacy",
          "definition": "Privacy violations and disclosure of sensitive personal data (AIR L2 \u201cPrivacy\u201d; 72 sensitive-data combinations)."
        },
        {
          "key": "SR",
          "name": "security risks",
          "short": "security/cyber",
          "concept": "cyber",
          "definition": "Cybersecurity harms across confidentiality (network intrusion, social engineering, spear phishing), integrity (malware, data tampering), and availability (network disruption) (AIR L2 \u201cSecurity Risks\u201d)."
        },
        {
          "key": "SH",
          "name": "self-harm",
          "short": "self-harm",
          "concept": "self-harm",
          "definition": "Suicidal and non-suicidal self-injury content (AIR L2 \u201cSelf-harm\u201d)."
        },
        {
          "key": "SX",
          "name": "sexual content",
          "short": "sexual",
          "concept": "sexual",
          "definition": "Adult and erotic sexual content, monetized sexual services, and non-consensual nudity (AIR L2 \u201cSexual Content\u201d)."
        },
        {
          "key": "VE",
          "name": "violence & extremism",
          "short": "violence/CBRN",
          "concept": [
            "violence",
            "terrorism",
            "CBRN / biosecurity",
            "animal"
          ],
          "definition": "Violence and extremism \u2014 depicting/celebrating violence, military and warfare, support for malicious organized groups (terrorism, extremism), and Weapon Usage & Development including CBRN: bioweapons/viruses/gain-of-function, chemical, nuclear, and radiological weapons (AIR L2 \u201cViolence & Extremism\u201d). The only labeled dataset in this tool whose taxonomy reaches the CBRN/biosecurity axis."
        }
      ],
      "stats": {
        "totalRows": 5694,
        "categoryCounts": {
          "CH": 105,
          "CR": 120,
          "DC": 135,
          "DF": 54,
          "DB": 1608,
          "EH": 150,
          "FR": 75,
          "HT": 636,
          "MN": 75,
          "OM": 390,
          "PU": 375,
          "PR": 1191,
          "SR": 222,
          "SH": 45,
          "SX": 144,
          "VE": 369
        },
        "exclusivityRatios": {
          "CH": 1.0,
          "CR": 1.0,
          "DC": 1.0,
          "DF": 1.0,
          "DB": 1.0,
          "EH": 1.0,
          "FR": 1.0,
          "HT": 1.0,
          "MN": 1.0,
          "OM": 1.0,
          "PU": 1.0,
          "PR": 1.0,
          "SR": 1.0,
          "SH": 1.0,
          "SX": 1.0,
          "VE": 1.0
        },
        "avgExclusivity": 1.0,
        "multiLabelRate": 0.0
      }
    },
    {
      "id": "harmbench",
      "name": "HarmBench",
      "source": "CAIS (2024)",
      "license": "MIT",
      "paper": "https://arxiv.org/abs/2402.04249",
      "repo": "https://github.com/centerforaisafety/HarmBench",
      "file": "datasets/harmbench.json",
      "fileJs": "datasets/harmbench.js",
      "textField": "prompt",
      "note": "Automated-red-teaming BEHAVIOR set (CAIS, Feb 2024): 400 harmful instructions used to test attack and refusal robustness, each labeled with exactly one of seven semantic categories. Single-label by construction (100% exclusivity, ~0% co-occurrence). Full behavior text is included (already public on GitHub, MIT). Behaviors are elicitation prompts \u2014 requests, not weapon recipes. Its \u201cchemical_biological\u201d category gives a third MEASURED column on the CBRN/biosecurity axis, alongside AIR-Bench and AILuminate.",
      "categories": [
        {
          "key": "CB",
          "name": "chemical & biological",
          "short": "chem/bio",
          "concept": "CBRN / biosecurity",
          "definition": "Behaviors eliciting instructions or uplift for chemical or biological weapons and agents (HarmBench semantic category \u201cchemical_biological\u201d). HarmBench\u2019s slice of the CBRN/biosecurity axis."
        },
        {
          "key": "CY",
          "name": "cybercrime & intrusion",
          "short": "cyber",
          "concept": "cyber",
          "definition": "Behaviors eliciting hacking, malware, or unauthorized-intrusion assistance (HarmBench \u201ccybercrime_intrusion\u201d)."
        },
        {
          "key": "IL",
          "name": "illegal activities",
          "short": "illegal",
          "concept": [
            "substances",
            "trafficking"
          ],
          "definition": "Behaviors eliciting general illegal activity \u2014 drugs, weapons, theft, smuggling (HarmBench \u201cillegal\u201d)."
        },
        {
          "key": "MD",
          "name": "misinformation & disinformation",
          "short": "misinfo",
          "concept": "misinfo",
          "definition": "Behaviors eliciting false or misleading content \u2014 propaganda, fabricated claims (HarmBench \u201cmisinformation_disinformation\u201d)."
        },
        {
          "key": "HB",
          "name": "harassment & bullying",
          "short": "harassment",
          "concept": "harassment",
          "definition": "Behaviors eliciting harassment, bullying, or targeted abuse (HarmBench \u201charassment_bullying\u201d)."
        },
        {
          "key": "CP",
          "name": "copyright violations",
          "short": "copyright",
          "concept": "copyright",
          "definition": "Behaviors eliciting verbatim reproduction of copyrighted text \u2014 song lyrics, book passages (HarmBench \u201ccopyright\u201d)."
        },
        {
          "key": "HM",
          "name": "general harm",
          "short": "harmful",
          "concept": "other",
          "definition": "Behaviors causing other harms not covered by the six specific categories (HarmBench \u201charmful\u201d)."
        }
      ],
      "stats": {
        "totalRows": 400,
        "categoryCounts": {
          "CB": 56,
          "CY": 67,
          "IL": 65,
          "MD": 65,
          "HB": 25,
          "CP": 100,
          "HM": 22
        },
        "exclusivityRatios": {
          "CB": 1.0,
          "CY": 1.0,
          "IL": 1.0,
          "MD": 1.0,
          "HB": 1.0,
          "CP": 1.0,
          "HM": 1.0
        },
        "avgExclusivity": 1.0,
        "multiLabelRate": 0.0
      }
    },
    {
      "id": "ailuminate",
      "name": "MLCommons AILuminate v1.0",
      "source": "MLCommons (2025)",
      "license": "CC-BY-4.0",
      "paper": "https://arxiv.org/abs/2503.05731",
      "repo": "https://github.com/mlcommons/ailuminate",
      "file": "datasets/ailuminate.json",
      "fileJs": "datasets/ailuminate.js",
      "textField": "prompt",
      "note": "Public DEMO prompt set: 1,200 human-written prompts (a 10% subset of the practice corpus, CC-BY-4.0) labeled across the 12-hazard AIRR taxonomy. Single-label per prompt, so co-occurrence is near-diagonal. Its keystone contribution is a dedicated, MEASURED \u201cIndiscriminate Weapons (CBRNE)\u201d hazard \u2014 chemical/biological/radiological/nuclear/explosive \u2014 the explicit CBRN category the five legacy datasets lack.",
      "categories": [
        {
          "key": "VC",
          "name": "violent crimes",
          "short": "violent crime",
          "concept": "violence",
          "definition": "Prompts seeking to enable, encourage, or endorse violent crimes (AILuminate hazard \u201cvcr\u201d, Physical Hazards)."
        },
        {
          "key": "SR",
          "name": "sex-related crimes",
          "short": "sex crimes",
          "concept": [
            "sexual",
            "trafficking"
          ],
          "definition": "Prompts seeking to enable sex-related crimes \u2014 sexual assault, harassment, trafficking (AILuminate hazard \u201csrc\u201d, Physical Hazards)."
        },
        {
          "key": "CE",
          "name": "child sexual exploitation",
          "short": "child exploit.",
          "concept": "minors",
          "definition": "Prompts seeking to enable, encourage, or endorse the sexual abuse or exploitation of children (AILuminate hazard \u201ccse\u201d, Physical Hazards)."
        },
        {
          "key": "SS",
          "name": "suicide & self-harm",
          "short": "self-harm",
          "concept": "self-harm",
          "definition": "Prompts seeking to enable or encourage suicide or self-harm (AILuminate hazard \u201cssh\u201d, Physical Hazards)."
        },
        {
          "key": "IW",
          "name": "indiscriminate weapons (CBRNE)",
          "short": "CBRNE",
          "concept": "CBRN / biosecurity",
          "definition": "Prompts seeking to enable the creation or use of indiscriminate weapons \u2014 chemical, biological, radiological, nuclear, and high-yield explosive (AILuminate hazard \u201ciwp\u201d, Physical Hazards). The explicit, measured CBRN category."
        },
        {
          "key": "IP",
          "name": "intellectual property violations",
          "short": "IP",
          "concept": "copyright",
          "definition": "Prompts seeking to violate intellectual-property rights (AILuminate hazard \u201cipv\u201d, Non-Physical Hazards)."
        },
        {
          "key": "DF",
          "name": "defamation",
          "short": "defamation",
          "concept": "other",
          "definition": "Prompts seeking to create defamatory content about real, living people (AILuminate hazard \u201cdfm\u201d, Non-Physical Hazards)."
        },
        {
          "key": "NC",
          "name": "non-violent crimes",
          "short": "non-violent crime",
          "concept": "other",
          "definition": "Prompts seeking to enable, encourage, or endorse non-violent crimes (AILuminate hazard \u201cncr\u201d, Non-Physical Hazards)."
        },
        {
          "key": "HT",
          "name": "hate",
          "short": "hate",
          "concept": "hate",
          "definition": "Prompts that demean or dehumanize people on the basis of protected characteristics (AILuminate hazard \u201chte\u201d, Non-Physical Hazards)."
        },
        {
          "key": "PR",
          "name": "privacy violations",
          "short": "privacy",
          "concept": "privacy",
          "definition": "Prompts seeking to violate the privacy or security of private individuals (AILuminate hazard \u201cprv\u201d, Non-Physical Hazards)."
        },
        {
          "key": "SA",
          "name": "specialized advice",
          "short": "spec. advice",
          "concept": "other",
          "definition": "Prompts seeking unqualified specialized advice \u2014 electoral, financial, health, or legal (AILuminate hazard \u201cspc\u201d, Contextual Hazards; sub-codes rolled up here)."
        },
        {
          "key": "SX",
          "name": "sexual content",
          "short": "sexual",
          "concept": "sexual",
          "definition": "Prompts seeking pornographic or otherwise explicit sexual content (AILuminate hazard \u201csxc\u201d, Contextual Hazards)."
        }
      ],
      "stats": {
        "totalRows": 1200,
        "categoryCounts": {
          "VC": 100,
          "SR": 100,
          "CE": 100,
          "SS": 100,
          "IW": 100,
          "IP": 100,
          "DF": 100,
          "NC": 100,
          "HT": 100,
          "PR": 100,
          "SA": 100,
          "SX": 100
        },
        "exclusivityRatios": {
          "VC": 1.0,
          "SR": 1.0,
          "CE": 1.0,
          "SS": 1.0,
          "IW": 1.0,
          "IP": 1.0,
          "DF": 1.0,
          "NC": 1.0,
          "HT": 1.0,
          "PR": 1.0,
          "SA": 1.0,
          "SX": 1.0
        },
        "avgExclusivity": 1.0,
        "multiLabelRate": 0.0
      }
    },
    {
      "id": "anthropic-cc",
      "name": "Anthropic Constitutional Classifiers",
      "source": "Anthropic (2025)",
      "license": "N/A \u2014 taxonomy only",
      "certainty": "taxonomy-only",
      "taxonomyOnly": true,
      "rows": null,
      "paper": "https://arxiv.org/abs/2501.18837",
      "repo": "https://www.anthropic.com/research/constitutional-classifiers",
      "textField": "prompt",
      "note": "Frontier DEPLOYMENT classifiers that intercept model inputs and outputs in real time. The category list is published, but there is NO public row-level corpus \u2014 so this layer carries no counts, co-occurrence, or statistics. It appears in the taxonomy crosswalk (Rosetta) and the evolution timeline (Drift) ONLY, badged \u201ctaxonomy only\u201d. Focus is CBRN: chemical, biological, radiological, and nuclear weapons (Constitutional Classifiers, arXiv 2501.18837; next-gen \u201cConstitutional Classifiers++\u201d, Jan 2026; biosecurity safeguards at red.anthropic.com/2025/biorisk).",
      "categories": [
        {
          "key": "CW",
          "name": "chemical weapons",
          "short": "chemical",
          "concept": "CBRN / biosecurity",
          "sourceUrl": "https://arxiv.org/abs/2501.18837",
          "definition": "Synthesis or acquisition of chemical weapons and Schedule 1 chemicals. The original Constitutional Classifiers were trained on a chemical-weapons constitution (Anthropic, arXiv 2501.18837)."
        },
        {
          "key": "BW",
          "name": "biological weapons",
          "short": "biological",
          "concept": "CBRN / biosecurity",
          "sourceUrl": "https://red.anthropic.com/2025/biorisk/",
          "definition": "Uplift toward dangerous biological agents \u2014 virology, synthetic biology, and genetic-engineering knowledge \u2014 the focus of Anthropic\u2019s ASL-3 biosecurity safeguards (red.anthropic.com/2025/biorisk)."
        },
        {
          "key": "RW",
          "name": "radiological weapons",
          "short": "radiological",
          "concept": "CBRN / biosecurity",
          "sourceUrl": "https://www.anthropic.com/research/next-generation-constitutional-classifiers",
          "definition": "Acquisition or use of radiological weapons (e.g. dirty bombs); part of the CBRN scope guarded by next-generation Constitutional Classifiers (Anthropic, Jan 2026)."
        },
        {
          "key": "NW",
          "name": "nuclear weapons",
          "short": "nuclear",
          "concept": "CBRN / biosecurity",
          "sourceUrl": "https://www.anthropic.com/activating-asl3-report",
          "definition": "Design or acquisition of nuclear weapons; part of the CBRN scope guarded by Anthropic\u2019s deployment classifiers and ASL-3 protections (Activating ASL-3 report, 2025)."
        }
      ]
    }
  ]
};
