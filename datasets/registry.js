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
          "concept": "toxicity",
          "definition": "Comments that are rude, disrespectful, or otherwise likely to make someone leave a discussion."
        },
        {
          "key": "ST",
          "name": "severe toxic",
          "short": "severe toxic",
          "concept": "toxicity",
          "definition": "Comments that are very hateful, aggressive, or disrespectful to an extreme degree."
        },
        {
          "key": "OB",
          "name": "obscene",
          "short": "obscene",
          "concept": "toxicity",
          "definition": "Comments containing obscene or vulgar language."
        },
        {
          "key": "TH",
          "name": "threat",
          "short": "threat",
          "concept": "violence",
          "definition": "Comments containing threats of violence or harm."
        },
        {
          "key": "IN",
          "name": "insult",
          "short": "insult",
          "concept": "hate",
          "definition": "Comments intended to insult or demean someone."
        },
        {
          "key": "IH",
          "name": "identity hate",
          "short": "identity hate",
          "concept": "hate",
          "definition": "Comments that express hatred toward a person based on identity (race, religion, gender, etc.)."
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
          "concept": "sexual",
          "definition": "Content meant to arouse sexual excitement, such as the description of sexual activity, or that promotes sexual services (excluding sex education and wellness)."
        },
        {
          "key": "H",
          "name": "hate speech",
          "short": "hate",
          "concept": "hate",
          "definition": "Content that expresses, incites, or promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste."
        },
        {
          "key": "V",
          "name": "violence",
          "short": "violence",
          "concept": "violence",
          "definition": "Content that promotes or glorifies violence or celebrates the suffering or humiliation of others."
        },
        {
          "key": "HR",
          "name": "harassment",
          "short": "harassment",
          "concept": "harassment",
          "definition": "Content that may be used to torment or annoy individuals in real life, or make harassment more likely to occur."
        },
        {
          "key": "SH",
          "name": "self-harm",
          "short": "self-harm",
          "concept": "self-harm",
          "definition": "Content that promotes, encourages, or depicts acts of self-harm, such as suicide, cutting, and eating disorders."
        },
        {
          "key": "S3",
          "name": "sexual/minors",
          "short": "sexual/minors",
          "concept": [
            "sexual",
            "minors"
          ],
          "definition": "Sexual content that includes an individual who is under 18 years old."
        },
        {
          "key": "H2",
          "name": "hate/threatening",
          "short": "hate/threat.",
          "concept": [
            "hate",
            "violence"
          ],
          "definition": "Hateful content that also includes violence or serious harm towards the targeted group."
        },
        {
          "key": "V2",
          "name": "violence/graphic",
          "short": "violence/graphic",
          "concept": "violence",
          "definition": "Violent content that depicts death, violence, or serious physical injury in extreme graphic detail."
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
          "concept": "animal",
          "definition": "Content that promotes or depicts cruelty, harm, or neglect toward animals."
        },
        {
          "key": "CA",
          "name": "child abuse",
          "short": "child abuse",
          "concept": "minors",
          "definition": "Content involving harm, exploitation, or endangerment of minors."
        },
        {
          "key": "CT",
          "name": "controversial topics/politics",
          "short": "politics",
          "concept": "politics",
          "definition": "Content involving divisive political, social, or ideological topics."
        },
        {
          "key": "DS",
          "name": "discrimination/stereotype",
          "short": "discrimination",
          "concept": "hate",
          "definition": "Content that promotes discrimination, stereotypes, or injustice based on group identity."
        },
        {
          "key": "DW",
          "name": "drug abuse/weapons",
          "short": "drugs/weapons",
          "concept": "substances",
          "definition": "Content promoting drug abuse, weapons, or banned substances."
        },
        {
          "key": "FC",
          "name": "financial crime/theft",
          "short": "financial crime",
          "concept": "fraud",
          "definition": "Content related to financial crimes, property crimes, or theft."
        },
        {
          "key": "HS",
          "name": "hate speech/offensive",
          "short": "hate/offense",
          "concept": "hate",
          "definition": "Content containing hate speech or offensive language targeting groups or individuals."
        },
        {
          "key": "ME",
          "name": "misinformation",
          "short": "misinfo",
          "concept": "misinfo",
          "definition": "Misinformation regarding ethics, laws, and safety topics."
        },
        {
          "key": "NV",
          "name": "non-violent unethical behavior",
          "short": "unethical",
          "concept": "manipulation",
          "definition": "Content promoting unethical behavior that does not involve physical violence."
        },
        {
          "key": "PV",
          "name": "privacy violation",
          "short": "privacy",
          "concept": "privacy",
          "definition": "Content that violates or encourages violation of personal privacy."
        },
        {
          "key": "SH",
          "name": "self-harm",
          "short": "self-harm",
          "concept": "self-harm",
          "definition": "Content that promotes, encourages, or depicts acts of self-harm."
        },
        {
          "key": "SE",
          "name": "sexually explicit/adult",
          "short": "sexual",
          "concept": "sexual",
          "definition": "Sexually explicit or adult content."
        },
        {
          "key": "TC",
          "name": "terrorism/organized crime",
          "short": "terrorism",
          "concept": "terrorism",
          "definition": "Content related to terrorism or organized criminal activities."
        },
        {
          "key": "VI",
          "name": "violence/incitement",
          "short": "violence",
          "concept": "violence",
          "definition": "Content that promotes violence, aiding and abetting, or incitement to violence."
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
      "divergenceFields": {
        "type": "response_pair",
        "prefixes": [
          "_r0_",
          "_r1_"
        ],
        "labels": [
          "Response 0 categories",
          "Response 1 categories"
        ],
        "extraFields": [
          "_safer",
          "_better"
        ]
      },
      "categories": [
        {
          "key": "AB",
          "name": "animal abuse",
          "short": "animal abuse",
          "concept": "animal",
          "definition": "Content that promotes or depicts cruelty, harm, or neglect toward animals."
        },
        {
          "key": "CC",
          "name": "cybercrime",
          "short": "cybercrime",
          "concept": "cyber",
          "definition": "Content related to hacking, phishing, malware, or other computer-based crimes."
        },
        {
          "key": "CI",
          "name": "copyright issues",
          "short": "copyright",
          "concept": "copyright",
          "definition": "Content involving copyright infringement or intellectual property violations."
        },
        {
          "key": "DB",
          "name": "discriminatory behavior",
          "short": "discrimination",
          "concept": "hate",
          "definition": "Content promoting discrimination based on identity characteristics."
        },
        {
          "key": "DR",
          "name": "drugs",
          "short": "drugs",
          "concept": "substances",
          "definition": "Content promoting drug use or production of controlled substances."
        },
        {
          "key": "EC",
          "name": "economic crime",
          "short": "econ. crime",
          "concept": "fraud",
          "definition": "Content related to fraud, embezzlement, or financial crimes."
        },
        {
          "key": "ED",
          "name": "environmental damage",
          "short": "environment",
          "concept": "environment",
          "definition": "Content promoting or facilitating environmental harm or pollution."
        },
        {
          "key": "HT",
          "name": "human trafficking",
          "short": "trafficking",
          "concept": "trafficking",
          "definition": "Content related to human trafficking, forced labor, or modern slavery."
        },
        {
          "key": "IB",
          "name": "insulting behavior",
          "short": "insults",
          "concept": "hate",
          "definition": "Content intended to insult, demean, or belittle individuals."
        },
        {
          "key": "MM",
          "name": "mental manipulation",
          "short": "manipulation",
          "concept": "manipulation",
          "definition": "Content designed to psychologically manipulate, gaslight, or coerce people."
        },
        {
          "key": "NS",
          "name": "endangering national security",
          "short": "nat. security",
          "concept": "terrorism",
          "definition": "Content that threatens national security or promotes espionage."
        },
        {
          "key": "PH",
          "name": "endangering public health",
          "short": "pub. health",
          "concept": "misinfo",
          "definition": "Content that endangers public health through misinformation or harmful advice."
        },
        {
          "key": "PO",
          "name": "disrupting public order",
          "short": "pub. order",
          "concept": "politics",
          "definition": "Content that promotes disruption of public order or civil unrest."
        },
        {
          "key": "PS",
          "name": "psychological harm",
          "short": "psych. harm",
          "concept": "self-harm",
          "definition": "Content that causes or promotes psychological distress, trauma, or emotional harm."
        },
        {
          "key": "PV",
          "name": "privacy violation",
          "short": "privacy",
          "concept": "privacy",
          "definition": "Content that violates or encourages violation of personal privacy."
        },
        {
          "key": "PY",
          "name": "physical harm",
          "short": "physical harm",
          "concept": "violence",
          "definition": "Content that promotes or facilitates physical harm to individuals."
        },
        {
          "key": "SX",
          "name": "sexual content",
          "short": "sexual",
          "concept": "sexual",
          "definition": "Sexually explicit or suggestive content."
        },
        {
          "key": "VL",
          "name": "violence",
          "short": "violence",
          "concept": "violence",
          "definition": "Content depicting or promoting violence."
        },
        {
          "key": "WC",
          "name": "white-collar crime",
          "short": "white-collar",
          "concept": "fraud",
          "definition": "Content related to corporate fraud, insider trading, or business-related crimes."
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
      "divergenceFields": {
        "type": "prompt_vs_response",
        "fields": [
          "_pl",
          "_rl",
          "_rls"
        ],
        "labels": [
          "Prompt label",
          "Response label",
          "Label source"
        ]
      },
      "categories": [
        {
          "key": "CO",
          "name": "copyright/trademark/plagiarism",
          "short": "copyright",
          "concept": "copyright",
          "definition": "Content involving copyright infringement, trademark violations, or plagiarism."
        },
        {
          "key": "CP",
          "name": "criminal planning/confessions",
          "short": "criminal plan.",
          "concept": "cyber",
          "definition": "Content involving planning or confessing to criminal activities."
        },
        {
          "key": "CS",
          "name": "controlled/regulated substances",
          "short": "substances",
          "concept": "substances",
          "definition": "Content related to controlled or regulated substances."
        },
        {
          "key": "FD",
          "name": "fraud/deception",
          "short": "fraud",
          "concept": "fraud",
          "definition": "Content involving fraudulent schemes or deceptive practices."
        },
        {
          "key": "GV",
          "name": "high-risk gov. decisions",
          "short": "gov. decisions",
          "concept": "politics",
          "definition": "Content related to high-risk government decision-making processes."
        },
        {
          "key": "GW",
          "name": "guns/illegal weapons",
          "short": "guns/weapons",
          "concept": "substances",
          "definition": "Content related to guns and illegal weapons."
        },
        {
          "key": "HA",
          "name": "harassment",
          "short": "harassment",
          "concept": "harassment",
          "definition": "Content intended to harass, bully, or intimidate individuals."
        },
        {
          "key": "HI",
          "name": "hate/identity hate",
          "short": "hate",
          "concept": "hate",
          "definition": "Content expressing hate based on identity characteristics."
        },
        {
          "key": "IA",
          "name": "illegal activity",
          "short": "illegal act.",
          "concept": "cyber",
          "definition": "Content promoting or describing general illegal activities."
        },
        {
          "key": "IU",
          "name": "immoral/unethical",
          "short": "unethical",
          "concept": "manipulation",
          "definition": "Content promoting immoral or unethical behavior."
        },
        {
          "key": "MN",
          "name": "manipulation",
          "short": "manipulation",
          "concept": "manipulation",
          "definition": "Content designed to manipulate or deceive people."
        },
        {
          "key": "MW",
          "name": "malware",
          "short": "malware",
          "concept": "cyber",
          "definition": "Content related to creating or distributing malicious software."
        },
        {
          "key": "NC",
          "name": "needs caution",
          "short": "caution",
          "concept": "other",
          "definition": "Content that requires careful handling but may not be explicitly harmful."
        },
        {
          "key": "OT",
          "name": "other",
          "short": "other",
          "concept": "other",
          "definition": "Content flagged for safety concerns not covered by other categories."
        },
        {
          "key": "PF",
          "name": "profanity",
          "short": "profanity",
          "concept": "toxicity",
          "definition": "Content containing profane or vulgar language."
        },
        {
          "key": "PI",
          "name": "PII/privacy",
          "short": "PII/privacy",
          "concept": "privacy",
          "definition": "Content involving personally identifiable information or privacy violations."
        },
        {
          "key": "PM",
          "name": "political/misinfo/conspiracy",
          "short": "misinfo",
          "concept": "misinfo",
          "definition": "Content involving political misinformation or conspiracy theories."
        },
        {
          "key": "SM",
          "name": "sexual (minor)",
          "short": "sexual/minor",
          "concept": [
            "sexual",
            "minors"
          ],
          "definition": "Sexual content involving minors."
        },
        {
          "key": "SS",
          "name": "suicide/self-harm",
          "short": "self-harm",
          "concept": "self-harm",
          "definition": "Content related to suicide or self-harm."
        },
        {
          "key": "SX",
          "name": "sexual",
          "short": "sexual",
          "concept": "sexual",
          "definition": "Sexually explicit or suggestive content."
        },
        {
          "key": "TH",
          "name": "threat",
          "short": "threat",
          "concept": "violence",
          "definition": "Content containing threats of violence or harm."
        },
        {
          "key": "UA",
          "name": "unauthorized advice",
          "short": "unauth. advice",
          "concept": "other",
          "definition": "Content providing unauthorized professional advice (legal, medical, financial)."
        },
        {
          "key": "VL",
          "name": "violence",
          "short": "violence",
          "concept": "violence",
          "definition": "Content depicting or promoting violence."
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
    }
  ]
};
