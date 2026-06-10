#!/usr/bin/env python3
"""
Preprocessing pipeline for where-the-lines-are datasets.

Downloads from HuggingFace, normalizes to {textField: str, key1: 0|1, ...},
outputs JSON + JS wrappers for browser consumption.

Usage:
    python scripts/preprocess.py openai        # reformat existing data
    python scripts/preprocess.py beavertails   # download + normalize
    python scripts/preprocess.py aegis         # download + normalize (+ divergence fields)
    python scripts/preprocess.py jigsaw        # download + normalize
    python scripts/preprocess.py saferlhf      # download + normalize (+ divergence fields)
    python scripts/preprocess.py airbench      # download + normalize (L4 leaf -> L2 rollup, 16 cats)
    python scripts/preprocess.py ailuminate    # download + normalize (12-hazard AIRR incl. CBRNE)
    python scripts/preprocess.py registry      # generate registry.json + .js
    python scripts/preprocess.py stats         # compute per-dataset stats into registry
    python scripts/preprocess.py xref          # build cross-dataset prompt index
    python scripts/preprocess.py fuzzy         # build fuzzy cross-dataset matching
    python scripts/preprocess.py all           # run all of the above
"""

import json
import os
import sys

DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'datasets')

# AIR-Bench 2024 (stanford-crfm/air-bench-2024) Level-2 taxonomy: 16 categories.
# Order/names are verbatim from the dataset's `l2-name` column. Each maps to a
# stable two-letter key used as a binary column. Single source of truth shared
# by process_airbench() and generate_registry().
AIRBENCH_L2 = [
    ('CH', 'Child Harm'),
    ('CR', 'Criminal Activities'),
    ('DC', 'Deception'),
    ('DF', 'Defamation'),
    ('DB', 'Discrimination/Bias'),
    ('EH', 'Economic Harm'),
    ('FR', 'Fundamental Rights'),
    ('HT', 'Hate/Toxicity'),
    ('MN', 'Manipulation'),
    ('OM', 'Operational Misuses'),
    ('PU', 'Political Usage'),
    ('PR', 'Privacy'),
    ('SR', 'Security Risks'),
    ('SH', 'Self-harm'),
    ('SX', 'Sexual Content'),
    ('VE', 'Violence & Extremism'),
]
AIRBENCH_NAME_TO_KEY = {name: key for key, name in AIRBENCH_L2}

# MLCommons AILuminate v1.0 (arXiv 2503.05731) 12-hazard AIRR taxonomy.
# Public DEMO prompt set (10% practice subset, 1,200 prompts, CC-BY-4.0) lives in
# the mlcommons/ailuminate GitHub repo, NOT on HF (the HF mirror is gated).
# The release uses sub-codes for two hazards; we roll them up to the 12 top-level
# hazards: spc_{ele,fin,hlt,lgl} -> Specialized Advice; sxc_prn -> Sexual Content.
AILUMINATE_HAZARD_TO_KEY = {
    'vcr': 'VC', 'src': 'SR', 'cse': 'CE', 'ssh': 'SS', 'iwp': 'IW',
    'ipv': 'IP', 'dfm': 'DF', 'ncr': 'NC', 'hte': 'HT', 'prv': 'PR',
    'spc_ele': 'SA', 'spc_fin': 'SA', 'spc_hlt': 'SA', 'spc_lgl': 'SA',
    'sxc_prn': 'SX',
}
# Order matches the taxonomy's Physical / Non-Physical / Contextual grouping.
AILUMINATE_KEYS = ['VC', 'SR', 'CE', 'SS', 'IW', 'IP', 'DF', 'NC', 'HT', 'PR', 'SA', 'SX']
AILUMINATE_DEMO_CSV = (
    'https://raw.githubusercontent.com/mlcommons/ailuminate/main/'
    'airr_official_1.0_demo_en_us_prompt_set_release.csv'
)

# HarmBench (CAIS, arXiv 2402.04249) automated-red-teaming behavior set. The
# public text "all" split is 400 behaviors, each labeled with exactly one of seven
# SemanticCategory values (single-label, like AIR-Bench/AILuminate). Distributed on
# GitHub under MIT; we download the raw CSV over plain HTTP (no HF lib). Behaviors
# are elicitation prompts (requests), not weapon recipes. Its 'chemical_biological'
# category is HarmBench's slice of the CBRN/biosecurity axis.
HARMBENCH_SEM_TO_KEY = {
    'chemical_biological': 'CB',
    'cybercrime_intrusion': 'CY',
    'illegal': 'IL',
    'misinformation_disinformation': 'MD',
    'harassment_bullying': 'HB',
    'copyright': 'CP',
    'harmful': 'HM',
}
# CB first to foreground the CBRN contribution; rest roughly by breadth.
HARMBENCH_KEYS = ['CB', 'CY', 'IL', 'MD', 'HB', 'CP', 'HM']
HARMBENCH_CSV = (
    'https://raw.githubusercontent.com/centerforaisafety/HarmBench/main/'
    'data/behavior_datasets/harmbench_behaviors_text_all.csv'
)


def ensure_datasets_dir():
    os.makedirs(DATASETS_DIR, exist_ok=True)


def write_json_and_js(dataset_id, data):
    """Write both .json and .js wrapper for a dataset."""
    json_path = os.path.join(DATASETS_DIR, f'{dataset_id}.json')
    js_path = os.path.join(DATASETS_DIR, f'{dataset_id}.js')

    print(f'  Writing {json_path} ({len(data)} rows)...')
    with open(json_path, 'w') as f:
        json.dump(data, f, separators=(',', ':'))

    size_mb = os.path.getsize(json_path) / (1024 * 1024)
    print(f'  JSON size: {size_mb:.1f} MB')

    print(f'  Writing {js_path}...')
    with open(js_path, 'w') as f:
        f.write(f'var dataset_{dataset_id} = ')
        json.dump(data, f, separators=(',', ':'))
        f.write(';\n')

    print(f'  Done: {dataset_id}')


def process_openai():
    """Reformat existing OpenAI dataset into datasets/ directory."""
    print('Processing OpenAI Moderation dataset...')
    src = os.path.join(os.path.dirname(DATASETS_DIR), 'dataset.json')
    if not os.path.exists(src):
        print(f'  ERROR: {src} not found. Skipping.')
        return

    with open(src) as f:
        data = json.load(f)

    print(f'  Loaded {len(data)} rows from dataset.json')

    # Normalize: ensure all 8 keys present (missing = 0)
    keys = ['S', 'H', 'V', 'HR', 'SH', 'S3', 'H2', 'V2']
    for row in data:
        assert 'prompt' in row, f'Missing prompt field: {list(row.keys())}'
        for k in keys:
            if k not in row:
                row[k] = 0

    write_json_and_js('openai', data)


def process_beavertails():
    """Download and normalize BeaverTails dataset."""
    print('Processing BeaverTails dataset...')
    from datasets import load_dataset

    print('  Downloading from HuggingFace (PKU-Alignment/BeaverTails)...')
    ds = load_dataset('PKU-Alignment/BeaverTails', split='330k_train')
    print(f'  Downloaded {len(ds)} rows')

    # BeaverTails category mapping: nested dict keys -> short keys
    CAT_MAP = {
        'animal_abuse': 'AA',
        'child_abuse': 'CA',
        'controversial_topics,politics': 'CT',
        'discrimination,stereotype,injustice': 'DS',
        'drug_abuse,bindowsapons,banned_substance': 'DW',
        'financial_crime,property_crime,theft': 'FC',
        'hate_speech,offensive_language': 'HS',
        'misinformation_regarding_ethics,bindowsaws_and_safety': 'ME',
        'non_violent_unethical_behavior': 'NV',
        'privacy_violation': 'PV',
        'self_harm': 'SH',
        'sexually_explicit,bindowsdult_content': 'SE',
        'terrorism,organized_crime': 'TC',
        'violence,bindowsiding_and_abetting,incitement': 'VI',
    }

    # First, discover the actual category keys from the dataset
    sample = ds[0]
    print(f'  Sample keys: {list(sample.keys())}')
    print(f'  Category field type: {type(sample.get("category", None))}')

    # Inspect category structure
    if isinstance(sample.get('category'), dict):
        actual_keys = sorted(sample['category'].keys())
        print(f'  Category dict keys ({len(actual_keys)}): {actual_keys}')
        # Build mapping from actual keys
        CAT_MAP = {}
        short_keys = ['AA', 'CA', 'CT', 'DS', 'DW', 'FC', 'HS', 'ME', 'NV', 'PV', 'SH', 'SE', 'TC', 'VI']
        # Map alphabetically
        for i, k in enumerate(actual_keys):
            if i < len(short_keys):
                CAT_MAP[k] = short_keys[i]
            else:
                CAT_MAP[k] = f'C{i}'
        print(f'  Category mapping: {CAT_MAP}')

    all_keys = sorted(CAT_MAP.values())
    data = []
    skipped = 0

    for i, row in enumerate(ds):
        prompt = row.get('prompt', '')
        if not prompt or not prompt.strip():
            skipped += 1
            continue

        entry = {'prompt': prompt.strip()}
        cat = row.get('category', {})

        if isinstance(cat, dict):
            for orig_key, short_key in CAT_MAP.items():
                entry[short_key] = 1 if cat.get(orig_key, False) else 0
        else:
            # Fallback: all zeros
            for short_key in all_keys:
                entry[short_key] = 0
            skipped += 1
            continue

        data.append(entry)

        if (i + 1) % 50000 == 0:
            print(f'  Processed {i + 1} rows...')

    print(f'  Final: {len(data)} rows ({skipped} skipped)')
    write_json_and_js('beavertails', data)


def process_aegis():
    """Download and normalize NVIDIA Aegis v2 dataset.

    Also extracts prompt_label (_pl), response_label (_rl), and
    response_label_source (_rls) for Split Verdict divergence analysis.
    """
    print('Processing NVIDIA Aegis v2 dataset...')
    from datasets import load_dataset

    print('  Downloading from HuggingFace (nvidia/Aegis-AI-Content-Safety-Dataset-2.0)...')
    ds = load_dataset('nvidia/Aegis-AI-Content-Safety-Dataset-2.0', split='train')
    print(f'  Downloaded {len(ds)} rows')

    sample = ds[0]
    print(f'  Sample keys: {list(sample.keys())}')
    print(f'  Sample text_type: {sample.get("text_type", "N/A")}')
    print(f'  Sample violated_categories: {sample.get("violated_categories", "N/A")}')
    print(f'  Sample prompt_label: {sample.get("prompt_label", "N/A")}')
    print(f'  Sample response_label: {sample.get("response_label", "N/A")}')
    print(f'  Sample response_label_source: {sample.get("response_label_source", "N/A")}')

    # Discover all violated categories
    all_cats = set()
    for row in ds:
        vc = row.get('violated_categories', '')
        if vc and vc.strip() and vc.strip().lower() != 'safe':
            cats = [c.strip() for c in vc.split(',')]
            all_cats.update(cats)

    print(f'  Unique violated categories ({len(all_cats)}): {sorted(all_cats)}')

    # Build category key mapping — all 23 known Aegis v2 categories
    CAT_MAP = {
        'Controlled/Regulated Substances': 'CS',
        'Copyright/Trademark/Plagiarism': 'CO',
        'Criminal Planning/Confessions': 'CP',
        'Fraud/Deception': 'FD',
        'Guns and Illegal Weapons': 'GW',
        'Harassment': 'HA',
        'Hate/Identity Hate': 'HI',
        'High Risk Gov Decision Making': 'GV',
        'Illegal Activity': 'IA',
        'Immoral/Unethical': 'IU',
        'Malware': 'MW',
        'Manipulation': 'MN',
        'Needs Caution': 'NC',
        'Other': 'OT',
        'PII/Privacy': 'PI',
        'Political/Misinformation/Conspiracy': 'PM',
        'Profanity': 'PF',
        'Sexual': 'SX',
        'Sexual (minor)': 'SM',
        'Suicide and Self Harm': 'SS',
        'Threat': 'TH',
        'Unauthorized Advice': 'UA',
        'Violence': 'VL',
    }

    # Reverse map for label parsing: category name (various forms) -> short key
    LABEL_MAP = dict(CAT_MAP)  # exact match first
    # Also handle lowercase and common variants
    for name, key in list(CAT_MAP.items()):
        LABEL_MAP[name.lower()] = key

    # Warn about any undiscovered categories
    for cat in sorted(all_cats):
        if cat not in CAT_MAP:
            print(f'  WARNING: Unknown category "{cat}" — skipping')
            CAT_MAP[cat] = None

    print(f'  Category mapping: {json.dumps(CAT_MAP, indent=2)}')
    all_keys = sorted(set(v for v in CAT_MAP.values() if v is not None))

    # Determine which field has the prompt text
    text_field = None
    for candidate in ['text', 'prompt', 'input']:
        if candidate in sample:
            text_field = candidate
            break

    if not text_field:
        print(f'  Available fields: {list(sample.keys())}')
        for k, v in sample.items():
            if isinstance(v, str) and len(v) > 50:
                text_field = k
                break

    print(f'  Using text field: {text_field}')

    def parse_label(label_str):
        """Parse a label string into a category short key, or 'safe'."""
        if not label_str or not label_str.strip():
            return 'safe'
        label = label_str.strip()
        if label.lower() == 'safe':
            return 'safe'
        # Try exact match, then lowercase match
        if label in LABEL_MAP:
            return LABEL_MAP[label]
        if label.lower() in LABEL_MAP:
            return LABEL_MAP[label.lower()]
        # Try partial match (label may contain extra text)
        for name, key in CAT_MAP.items():
            if key and name.lower() in label.lower():
                return key
        return label  # return raw if no match

    data = []
    skipped = 0
    rls_values = set()

    for row in ds:
        prompt = row.get(text_field, '')
        if not prompt or not prompt.strip() or prompt.strip() == 'REDACTED':
            skipped += 1
            continue

        entry = {'prompt': prompt.strip()}

        # Initialize all categories to 0
        for key in all_keys:
            entry[key] = 0

        # Parse violated_categories
        vc = row.get('violated_categories', '')
        if vc and vc.strip() and vc.strip().lower() != 'safe':
            cats = [c.strip() for c in vc.split(',')]
            for cat in cats:
                mapped = CAT_MAP.get(cat)
                if mapped:
                    entry[mapped] = 1

        # Divergence fields: prompt_label, response_label, response_label_source
        entry['_pl'] = parse_label(row.get('prompt_label', ''))
        entry['_rl'] = parse_label(row.get('response_label', ''))
        rls = row.get('response_label_source', '')
        entry['_rls'] = rls.strip() if rls else ''
        rls_values.add(entry['_rls'])

        data.append(entry)

    print(f'  Label source values: {sorted(rls_values)}')
    print(f'  Final: {len(data)} rows ({skipped} skipped)')
    write_json_and_js('aegis', data)


def process_jigsaw():
    """Download and normalize Jigsaw Toxic Comment Classification dataset."""
    print('Processing Jigsaw Toxic Comment Classification dataset...')
    from datasets import load_dataset

    print('  Downloading from HuggingFace (Arsive/toxicity_classification_jigsaw)...')
    # The labeled data is split across 'train' and 'validation'; 'test' has -1 labels
    from datasets import concatenate_datasets
    ds_train = load_dataset('Arsive/toxicity_classification_jigsaw', split='train')
    ds_val = load_dataset('Arsive/toxicity_classification_jigsaw', split='validation')
    ds = concatenate_datasets([ds_train, ds_val])
    print(f'  Downloaded {len(ds)} rows (train={len(ds_train)}, val={len(ds_val)})')

    sample = ds[0]
    print(f'  Sample keys: {list(sample.keys())}')

    # Jigsaw has 6 binary columns natively: toxic, severe_toxic, obscene, threat, insult, identity_hate
    # Map to short keys
    CAT_MAP = {
        'toxic': 'TX',
        'severe_toxic': 'ST',
        'obscene': 'OB',
        'threat': 'TH',
        'insult': 'IN',
        'identity_hate': 'IH',
    }

    all_keys = sorted(CAT_MAP.values())
    data = []
    skipped = 0

    for i, row in enumerate(ds):
        text = row.get('comment_text', '')
        if not text or not text.strip():
            skipped += 1
            continue

        entry = {'comment': text.strip()}
        for orig_key, short_key in CAT_MAP.items():
            entry[short_key] = 1 if row.get(orig_key, 0) else 0

        data.append(entry)

        if (i + 1) % 50000 == 0:
            print(f'  Processed {i + 1} rows...')

    print(f'  Final: {len(data)} rows ({skipped} skipped)')
    write_json_and_js('jigsaw', data)


def process_saferlhf():
    """Download and normalize PKU-SafeRLHF dataset.

    Preserves per-response harm categories (_r0_XX, _r1_XX) alongside
    merged categories (XX) for the Split Verdict divergence visualization.
    Also preserves _safer and _better fields.
    """
    print('Processing PKU-SafeRLHF dataset...')
    from datasets import load_dataset

    print('  Downloading from HuggingFace (PKU-Alignment/PKU-SafeRLHF)...')
    ds = load_dataset('PKU-Alignment/PKU-SafeRLHF', split='train')
    print(f'  Downloaded {len(ds)} rows')

    sample = ds[0]
    print(f'  Sample keys: {list(sample.keys())}')

    # 19 category mapping
    CAT_MAP = {
        'Animal Abuse': 'AB',
        'Copyright Issues': 'CI',
        'Cybercrime': 'CC',
        'Discriminatory Behavior': 'DB',
        'Disrupting Public Order': 'PO',
        'Drugs': 'DR',
        'Economic Crime': 'EC',
        'Endangering National Security': 'NS',
        'Endangering Public Health': 'PH',
        'Environmental Damage': 'ED',
        'Human Trafficking': 'HT',
        'Insulting Behavior': 'IB',
        'Mental Manipulation': 'MM',
        'Physical Harm': 'PY',
        'Privacy Violation': 'PV',
        'Psychological Harm': 'PS',
        'Sexual Content': 'SX',
        'Violence': 'VL',
        'White-Collar Crime': 'WC',
    }

    all_keys = sorted(CAT_MAP.values())
    data = []
    skipped = 0
    seen_prompts = set()  # deduplicate prompts

    for i, row in enumerate(ds):
        prompt = row.get('prompt', '')
        if not prompt or not prompt.strip():
            skipped += 1
            continue

        prompt_clean = prompt.strip()

        cat0 = row.get('response_0_harm_category', {})
        cat1 = row.get('response_1_harm_category', {})

        # Deduplicate: same prompt can appear multiple times with different responses
        # Merge categories across all appearances (union of harm flags)
        prompt_hash = hash(prompt_clean)
        if prompt_hash in seen_prompts:
            for existing in reversed(data):
                if existing['prompt'] == prompt_clean:
                    for orig_key, short_key in CAT_MAP.items():
                        v0 = 1 if cat0.get(orig_key, False) else 0
                        v1 = 1 if cat1.get(orig_key, False) else 0
                        existing[short_key] = max(existing[short_key], v0, v1)
                        # Also merge per-response fields (OR)
                        existing['_r0_' + short_key] = max(existing.get('_r0_' + short_key, 0), v0)
                        existing['_r1_' + short_key] = max(existing.get('_r1_' + short_key, 0), v1)
                    break
            continue

        seen_prompts.add(prompt_hash)
        entry = {'prompt': prompt_clean}

        # Merged categories (union across both responses — backward compatible)
        for orig_key, short_key in CAT_MAP.items():
            v0 = 1 if cat0.get(orig_key, False) else 0
            v1 = 1 if cat1.get(orig_key, False) else 0
            entry[short_key] = max(v0, v1)
            # Per-response categories for divergence analysis
            entry['_r0_' + short_key] = v0
            entry['_r1_' + short_key] = v1

        # Safer/better response IDs (0 or 1, or -1 if equal)
        safer = row.get('safer_response_id', None)
        better = row.get('better_response_id', None)
        entry['_safer'] = safer if safer is not None else -1
        entry['_better'] = better if better is not None else -1

        data.append(entry)

        if (i + 1) % 50000 == 0:
            print(f'  Processed {i + 1} rows...')

    print(f'  Final: {len(data)} rows ({skipped} skipped, deduped from {len(ds)})')
    write_json_and_js('saferlhf', data)


def process_airbench():
    """Download and normalize AIR-Bench 2024 (stanford-crfm/air-bench-2024).

    AIR-Bench is single-label per prompt at the leaf (L4). We roll each prompt's
    L4 leaf up to its Level-2 category (16 categories) and emit a flat
    {prompt, <16 two-letter keys>: 0|1} row with exactly one key set.

    Because it is single-label at leaf, the L2 rollup is also ~single-label:
    co-occurrence will be near-diagonal. AIR-Bench's contribution to this tool
    is taxonomic BREADTH (the policy-derived 16-category frontier taxonomy,
    including the CBRN/cyber axis absent from the other five datasets), NOT
    co-occurrence structure. That is honest and documented in the registry note.

    Source CSVs (one per leaf category, 5,694 prompts total) are downloaded from
    the HF repo over plain HTTP (the `datasets` library is not required).
    License on the card: cc-by-4.0.
    """
    import csv
    import io
    import urllib.request

    print('Processing AIR-Bench 2024 dataset...')

    repo = 'stanford-crfm/air-bench-2024'
    api_url = f'https://huggingface.co/api/datasets/{repo}'
    print(f'  Listing files from {api_url} ...')
    with urllib.request.urlopen(api_url) as resp:
        meta = json.load(resp)
    csv_files = sorted(
        s['rfilename'] for s in meta.get('siblings', [])
        if s['rfilename'].startswith('category_') and s['rfilename'].endswith('.csv')
    )
    print(f'  Found {len(csv_files)} category CSVs')

    keys = [k for k, _ in AIRBENCH_L2]
    rows = []
    unknown_l2 = set()
    skipped_empty = 0

    for fname in csv_files:
        url = f'https://huggingface.co/datasets/{repo}/resolve/main/{fname}'
        with urllib.request.urlopen(url) as resp:
            text = resp.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(text))
        for r in reader:
            prompt = (r.get('prompt') or '').strip()
            if not prompt:
                skipped_empty += 1
                continue
            l2 = (r.get('l2-name') or '').strip()
            key = AIRBENCH_NAME_TO_KEY.get(l2)
            if key is None:
                unknown_l2.add(l2)
                continue
            entry = {'prompt': prompt}
            for k in keys:
                entry[k] = 1 if k == key else 0
            rows.append(entry)

    if unknown_l2:
        print(f'  WARNING: unmapped L2 names skipped: {sorted(unknown_l2)}')
    print(f'  Final: {len(rows)} rows ({skipped_empty} empty prompts skipped)')
    # Sanity: every L2 must be populated (catches a broken mapping early).
    counts = {k: sum(row[k] for row in rows) for k in keys}
    zero = [k for k, c in counts.items() if c == 0]
    if zero:
        print(f'  WARNING: categories with zero rows: {zero}')
    write_json_and_js('airbench', rows)


def process_ailuminate():
    """Download and normalize the MLCommons AILuminate v1.0 DEMO prompt set.

    Public 10% practice subset (1,200 prompts, CC-BY-4.0) from the
    mlcommons/ailuminate GitHub repo. Each prompt carries exactly one hazard;
    we roll the release's sub-codes up to the 12 top-level AIRR hazards and emit
    a flat {prompt, <12 keys>: 0|1} row with one key set.

    Like AIR-Bench, this is single-label by construction (near-diagonal
    co-occurrence). Its value here is the dedicated, MEASURED
    'Indiscriminate Weapons (CBRNE)' hazard — the explicit CBRN category that
    the five legacy datasets lack.
    """
    import csv
    import io
    import urllib.request

    print('Processing MLCommons AILuminate v1.0 DEMO dataset...')
    print(f'  Downloading {AILUMINATE_DEMO_CSV} ...')
    with urllib.request.urlopen(AILUMINATE_DEMO_CSV) as resp:
        text = resp.read().decode('utf-8')

    reader = csv.DictReader(io.StringIO(text))
    rows = []
    unknown = set()
    skipped_empty = 0
    for r in reader:
        prompt = (r.get('prompt_text') or '').strip()
        if not prompt:
            skipped_empty += 1
            continue
        hazard = (r.get('hazard') or '').strip()
        key = AILUMINATE_HAZARD_TO_KEY.get(hazard)
        if key is None:
            unknown.add(hazard)
            continue
        entry = {'prompt': prompt}
        for k in AILUMINATE_KEYS:
            entry[k] = 1 if k == key else 0
        rows.append(entry)

    if unknown:
        print(f'  WARNING: unmapped hazard codes skipped: {sorted(unknown)}')
    print(f'  Final: {len(rows)} rows ({skipped_empty} empty prompts skipped)')
    counts = {k: sum(row[k] for row in rows) for k in AILUMINATE_KEYS}
    zero = [k for k, c in counts.items() if c == 0]
    if zero:
        print(f'  WARNING: categories with zero rows: {zero}')
    print(f'  CBRNE (IW) count: {counts["IW"]}')
    write_json_and_js('ailuminate', rows)


def process_harmbench():
    """Download and normalize the HarmBench text behavior set (CAIS, 2024).

    The public text "all" split is 400 automated-red-teaming behaviors (harmful
    instructions used to test attack/refusal robustness), each labeled with exactly
    one of seven SemanticCategory values. We emit a flat {prompt, <7 keys>: 0|1} row
    with a single key set — single-label by construction, like AIR-Bench and
    AILuminate. Full behavior text is kept (already public on GitHub under MIT).
    Behaviors are elicitation prompts (requests), not weapon recipes. The
    'chemical_biological' category is HarmBench's slice of the CBRN/biosecurity axis.
    The contextual behaviors' ContextString is intentionally dropped — we display the
    behavior instruction itself.
    """
    import csv
    import io
    import urllib.request

    print('Processing HarmBench text behavior set...')
    print(f'  Downloading {HARMBENCH_CSV} ...')
    with urllib.request.urlopen(HARMBENCH_CSV) as resp:
        text = resp.read().decode('utf-8')

    reader = csv.DictReader(io.StringIO(text))
    rows = []
    unknown = {}
    skipped_empty = 0
    for r in reader:
        prompt = (r.get('Behavior') or '').strip()
        if not prompt:
            skipped_empty += 1
            continue
        sem = (r.get('SemanticCategory') or '').strip()
        key = HARMBENCH_SEM_TO_KEY.get(sem)
        if key is None:
            unknown[sem] = unknown.get(sem, 0) + 1
            key = 'HM'  # fold any unmapped category into general harm
        entry = {'prompt': prompt}
        for k in HARMBENCH_KEYS:
            entry[k] = 1 if k == key else 0
        rows.append(entry)

    if unknown:
        print(f'  WARNING: unmapped SemanticCategory folded into HM: {unknown}')
    counts = {k: sum(row[k] for row in rows) for k in HARMBENCH_KEYS}
    print(f'  Final: {len(rows)} rows ({skipped_empty} empty prompts skipped)')
    print(f'  Category counts: {counts}')
    print(f'  chemical_biological (CB) count: {counts["CB"]}')
    write_json_and_js('harmbench', rows)


def compute_stats():
    """Compute aggregate statistics for all datasets and write into registry.json.

    Reads each dataset JSON and the current registry.json. For each dataset,
    computes: totalRows, categoryCounts, exclusivityRatios, avgExclusivity,
    multiLabelRate. Writes updated registry.json + registry.js.
    """
    print('Computing dataset statistics...')

    reg_path = os.path.join(DATASETS_DIR, 'registry.json')
    with open(reg_path) as f:
        registry = json.load(f)

    for ds_entry in registry['datasets']:
        ds_id = ds_entry['id']
        json_path = os.path.join(DATASETS_DIR, f'{ds_id}.json')
        if not os.path.exists(json_path):
            print(f'  Skipping {ds_id} — {json_path} not found')
            continue

        print(f'  Loading {ds_id}...')
        with open(json_path) as f:
            data = json.load(f)

        keys = [c['key'] for c in ds_entry['categories']]
        total = len(data)
        cat_counts = {k: 0 for k in keys}
        exclusive_counts = {k: 0 for k in keys}
        multi_label = 0

        for row in data:
            flagged = [k for k in keys if row.get(k, 0) == 1]
            n_flagged = len(flagged)
            if n_flagged > 1:
                multi_label += 1
            for k in flagged:
                cat_counts[k] += 1
                if n_flagged == 1:
                    exclusive_counts[k] += 1

        excl_ratios = {}
        for k in keys:
            if cat_counts[k] > 0:
                excl_ratios[k] = round(exclusive_counts[k] / cat_counts[k], 3)
            else:
                excl_ratios[k] = 0.0

        avg_excl = 0.0
        cats_with_counts = [k for k in keys if cat_counts[k] > 0]
        if cats_with_counts:
            avg_excl = round(sum(excl_ratios[k] for k in cats_with_counts) / len(cats_with_counts), 3)

        multi_rate = round(multi_label / total, 3) if total > 0 else 0.0

        ds_entry['stats'] = {
            'totalRows': total,
            'categoryCounts': cat_counts,
            'exclusivityRatios': excl_ratios,
            'avgExclusivity': avg_excl,
            'multiLabelRate': multi_rate
        }

        print(f'    {ds_id}: {total} rows, avg excl={avg_excl}, multi-label={multi_rate}')

    # Write updated registry
    with open(reg_path, 'w') as f:
        json.dump(registry, f, indent=2)

    js_path = os.path.join(DATASETS_DIR, 'registry.js')
    with open(js_path, 'w') as f:
        f.write('var datasetRegistry = ')
        json.dump(registry, f, indent=2)
        f.write(';\n')

    print('  Done: stats written to registry.json')


def build_xref():
    """Build cross-dataset prompt matching index.

    Loads all dataset JSONs, normalizes prompts, finds duplicates across
    datasets, outputs xref.json + xref.js with entries that appear in 2+ datasets.
    """
    print('Building cross-dataset prompt index (xref)...')

    reg_path = os.path.join(DATASETS_DIR, 'registry.json')
    with open(reg_path) as f:
        registry = json.load(f)

    def normalize_prompt(text):
        """Normalize for matching: lowercase, strip, collapse whitespace."""
        import re
        t = text.strip().lower()
        t = re.sub(r'\s+', ' ', t)
        return t

    # prompt_norm -> list of {dataset, cats: [keys]}
    prompt_index = {}

    for ds_entry in registry['datasets']:
        ds_id = ds_entry['id']
        json_path = os.path.join(DATASETS_DIR, f'{ds_id}.json')
        if not os.path.exists(json_path):
            print(f'  Skipping {ds_id} — not found')
            continue

        text_field = ds_entry.get('textField', 'prompt')
        keys = [c['key'] for c in ds_entry['categories']]

        print(f'  Loading {ds_id} ({json_path})...')
        with open(json_path) as f:
            data = json.load(f)

        for row in data:
            text = row.get(text_field, '')
            if not text:
                continue
            norm = normalize_prompt(text)
            flagged = [k for k in keys if row.get(k, 0) == 1]
            if not flagged:
                continue  # only index rows with at least one flag

            if norm not in prompt_index:
                prompt_index[norm] = []

            # Check if we already have an entry from this dataset
            existing = None
            for entry in prompt_index[norm]:
                if entry['dataset'] == ds_id:
                    existing = entry
                    break

            if existing:
                # Merge categories (union)
                for k in flagged:
                    if k not in existing['cats']:
                        existing['cats'].append(k)
            else:
                prompt_index[norm].append({
                    'dataset': ds_id,
                    'cats': flagged
                })

    # Filter to prompts appearing in 2+ datasets
    xref = []
    for norm, matches in prompt_index.items():
        datasets_seen = set(m['dataset'] for m in matches)
        if len(datasets_seen) >= 2:
            # Find one original prompt text (from first match)
            xref.append({
                'prompt': norm,  # normalized form
                'matches': matches
            })

    # Sort by number of datasets descending, then alphabetically
    xref.sort(key=lambda x: (-len(set(m['dataset'] for m in x['matches'])), x['prompt']))

    print(f'  Found {len(xref)} prompts in 2+ datasets')
    if xref:
        ds_pairs = {}
        for entry in xref:
            ds_set = tuple(sorted(set(m['dataset'] for m in entry['matches'])))
            ds_pairs[ds_set] = ds_pairs.get(ds_set, 0) + 1
        for pair, count in sorted(ds_pairs.items(), key=lambda x: -x[1]):
            print(f'    {" + ".join(pair)}: {count} shared prompts')

    # Write xref.json and xref.js
    json_path = os.path.join(DATASETS_DIR, 'xref.json')
    js_path = os.path.join(DATASETS_DIR, 'xref.js')

    print(f'  Writing {json_path} ({len(xref)} entries)...')
    with open(json_path, 'w') as f:
        json.dump(xref, f, separators=(',', ':'))

    size_mb = os.path.getsize(json_path) / (1024 * 1024)
    print(f'  JSON size: {size_mb:.1f} MB')

    print(f'  Writing {js_path}...')
    with open(js_path, 'w') as f:
        f.write('var dataset_xref = ')
        json.dump(xref, f, separators=(',', ':'))
        f.write(';\n')

    print(f'  Done: xref ({len(xref)} cross-dataset matches)')


def build_fuzzy_xref():
    """Build fuzzy cross-dataset prompt matching using MinHash LSH.

    Finds similar (but not identical) prompts across datasets using
    Jaccard similarity of word shingles. Uses datasketch's MinHash LSH
    if available, falls back to inverted-index blocking.

    Output: xref-fuzzy.json / xref-fuzzy.js with entries:
    {prompts: [text1, text2, ...], similarity: float, matches: [{dataset, cats}]}
    """
    import re

    print('Building fuzzy cross-dataset matching (xref-fuzzy)...')

    reg_path = os.path.join(DATASETS_DIR, 'registry.json')
    with open(reg_path) as f:
        registry = json.load(f)

    # Common English stop words
    STOP_WORDS = set([
        'the', 'and', 'to', 'a', 'of', 'it', 'in', 'i', 'that', 'is', 'on', 'for',
        'with', 'as', 'are', 'was', 'this', 'but', 'be', 'have', 'has', 'had', 'or',
        'an', 'my', 'if', 'me', 'so', 'you', 'we', 'they', 'he', 'she', 'them',
        'his', 'her', 'your', 'their', 'our', 'us', 'do', 'does', 'did', 'at', 'by',
        'from', 'what', 'who', 'which', 'where', 'when', 'why', 'how', 'can', 'could',
        'should', 'would', 'will', 'just', 'not', 'very', 'into', 'also', 'about',
        'up', 'down', 'out', 'no', 'yes', 'more', 'some', 'than'
    ])

    def tokenize(text):
        """Tokenize: lowercase, remove punctuation, remove stop words, min 2 chars."""
        words = re.sub(r'[^a-z0-9\s]', '', text.lower()).split()
        return [w for w in words if w not in STOP_WORDS and len(w) >= 2]

    # Load exact xref to exclude from fuzzy matches
    xref_path = os.path.join(DATASETS_DIR, 'xref.json')
    exact_norms = set()
    if os.path.exists(xref_path):
        with open(xref_path) as f:
            xref_data = json.load(f)
        for entry in xref_data:
            exact_norms.add(entry['prompt'])

    # Load all prompts from all datasets
    all_prompts = []  # [(dataset_id, text, tokens, cats)]
    for ds_entry in registry['datasets']:
        ds_id = ds_entry['id']
        json_path = os.path.join(DATASETS_DIR, f'{ds_id}.json')
        if not os.path.exists(json_path):
            print(f'  Skipping {ds_id} — not found')
            continue

        text_field = ds_entry.get('textField', 'prompt')
        keys = [c['key'] for c in ds_entry['categories']]

        print(f'  Loading {ds_id}...')
        with open(json_path) as f:
            data = json.load(f)

        for row in data:
            text = row.get(text_field, '')
            if not text or len(text.strip()) < 10:
                continue
            norm = re.sub(r'\s+', ' ', text.strip().lower())
            if norm in exact_norms:
                continue  # skip exact matches (already in xref)
            tokens = tokenize(text)
            if len(tokens) < 2:
                continue
            flagged = [k for k in keys if row.get(k, 0) == 1]
            if not flagged:
                continue
            all_prompts.append({
                'dataset': ds_id,
                'text': text.strip()[:200],
                'tokens': set(tokens),
                'cats': flagged
            })

    print(f'  Total prompts for fuzzy matching: {len(all_prompts)}')

    # Group by dataset for cross-dataset comparison
    by_dataset = {}
    for i, p in enumerate(all_prompts):
        ds = p['dataset']
        if ds not in by_dataset:
            by_dataset[ds] = []
        by_dataset[ds].append(i)

    ds_ids = sorted(by_dataset.keys())
    print(f'  Datasets: {ds_ids}')

    # Try datasketch LSH
    try:
        from datasketch import MinHash, MinHashLSH
        print('  Using datasketch MinHash LSH (128 permutations, threshold 0.7)...')

        NUM_PERM = 128
        THRESHOLD = 0.7

        # Build MinHash for each prompt
        minhashes = []
        for i, p in enumerate(all_prompts):
            m = MinHash(num_perm=NUM_PERM)
            for token in p['tokens']:
                m.update(token.encode('utf8'))
            minhashes.append(m)
            if (i + 1) % 50000 == 0:
                print(f'    MinHash: {i + 1}/{len(all_prompts)}')

        # Build LSH index per dataset, query across datasets
        matches = []
        for di in range(len(ds_ids)):
            ds_a = ds_ids[di]
            # Build LSH from dataset A
            lsh = MinHashLSH(threshold=THRESHOLD, num_perm=NUM_PERM)
            for idx in by_dataset[ds_a]:
                lsh.insert(str(idx), minhashes[idx])

            # Query from all other datasets
            for dj in range(di + 1, len(ds_ids)):
                ds_b = ds_ids[dj]
                pair_matches = 0
                for idx_b in by_dataset[ds_b]:
                    result = lsh.query(minhashes[idx_b])
                    for r in result:
                        idx_a = int(r)
                        # Compute exact Jaccard
                        tokens_a = all_prompts[idx_a]['tokens']
                        tokens_b = all_prompts[idx_b]['tokens']
                        intersection = len(tokens_a & tokens_b)
                        union = len(tokens_a | tokens_b)
                        sim = intersection / union if union > 0 else 0
                        if sim >= THRESHOLD:
                            matches.append({
                                'prompts': [all_prompts[idx_a]['text'], all_prompts[idx_b]['text']],
                                'similarity': round(sim, 2),
                                'matches': [
                                    {'dataset': all_prompts[idx_a]['dataset'], 'cats': all_prompts[idx_a]['cats']},
                                    {'dataset': all_prompts[idx_b]['dataset'], 'cats': all_prompts[idx_b]['cats']}
                                ]
                            })
                            pair_matches += 1
                            if len(matches) >= 10000:
                                break
                    if len(matches) >= 10000:
                        break
                print(f'    {ds_a} × {ds_b}: {pair_matches} fuzzy matches')
                if len(matches) >= 10000:
                    break
            if len(matches) >= 10000:
                print('  Reached 10K match cap.')
                break

    except ImportError:
        print('  datasketch not installed. Using inverted-index blocking fallback...')
        THRESHOLD = 0.7

        # Build inverted index: token -> set of prompt indices
        inv_index = {}
        for i, p in enumerate(all_prompts):
            for token in p['tokens']:
                if token not in inv_index:
                    inv_index[token] = set()
                inv_index[token].add(i)

        # For each prompt, find candidates from other datasets that share tokens
        matches = []
        seen_pairs = set()

        for i, p in enumerate(all_prompts):
            if len(matches) >= 10000:
                break
            candidates = set()
            for token in p['tokens']:
                if len(inv_index.get(token, set())) < 5000:  # skip very common tokens
                    candidates.update(inv_index.get(token, set()))

            for j in candidates:
                if j <= i:
                    continue
                if all_prompts[j]['dataset'] == p['dataset']:
                    continue
                pair_key = (min(i, j), max(i, j))
                if pair_key in seen_pairs:
                    continue

                tokens_a = p['tokens']
                tokens_b = all_prompts[j]['tokens']
                intersection = len(tokens_a & tokens_b)
                union = len(tokens_a | tokens_b)
                sim = intersection / union if union > 0 else 0

                if sim >= THRESHOLD:
                    seen_pairs.add(pair_key)
                    matches.append({
                        'prompts': [p['text'], all_prompts[j]['text']],
                        'similarity': round(sim, 2),
                        'matches': [
                            {'dataset': p['dataset'], 'cats': p['cats']},
                            {'dataset': all_prompts[j]['dataset'], 'cats': all_prompts[j]['cats']}
                        ]
                    })

            if (i + 1) % 10000 == 0:
                print(f'    Processed {i + 1}/{len(all_prompts)}, {len(matches)} matches so far')

    # Sort by similarity descending
    matches.sort(key=lambda x: -x['similarity'])
    matches = matches[:10000]

    print(f'  Total fuzzy matches: {len(matches)}')

    # Write output
    json_path = os.path.join(DATASETS_DIR, 'xref-fuzzy.json')
    js_path = os.path.join(DATASETS_DIR, 'xref-fuzzy.js')

    print(f'  Writing {json_path}...')
    with open(json_path, 'w') as f:
        json.dump(matches, f, separators=(',', ':'))

    size_mb = os.path.getsize(json_path) / (1024 * 1024)
    print(f'  JSON size: {size_mb:.1f} MB')

    print(f'  Writing {js_path}...')
    with open(js_path, 'w') as f:
        f.write('var dataset_xref_fuzzy = ')
        json.dump(matches, f, separators=(',', ':'))
        f.write(';\n')

    print(f'  Done: xref-fuzzy ({len(matches)} fuzzy matches)')


def generate_registry():
    """Generate registry.json and registry.js with full schema metadata."""
    print('Generating registry...')

    registry = {
        'datasets': [
            {
                'id': 'jigsaw',
                'name': 'Jigsaw Toxic Comments',
                'source': 'Google Jigsaw (2018)',
                'license': 'CC0',
                'paper': 'https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge',
                'repo': 'https://huggingface.co/datasets/Arsive/toxicity_classification_jigsaw',
                'file': 'datasets/jigsaw.json',
                'fileJs': 'datasets/jigsaw.js',
                'textField': 'comment',
                'note': '160K Wikipedia talk page comments classified across 6 toxicity categories. The founding multi-label content moderation dataset.',
                'categories': [
                    {'key': 'TX', 'name': 'toxic', 'short': 'toxic',
                     'definition': 'Comments that are rude, disrespectful, or otherwise likely to make someone leave a discussion.'},
                    {'key': 'ST', 'name': 'severe toxic', 'short': 'severe toxic',
                     'definition': 'Comments that are very hateful, aggressive, or disrespectful to an extreme degree.'},
                    {'key': 'OB', 'name': 'obscene', 'short': 'obscene',
                     'definition': 'Comments containing obscene or vulgar language.'},
                    {'key': 'TH', 'name': 'threat', 'short': 'threat',
                     'definition': 'Comments containing threats of violence or harm.'},
                    {'key': 'IN', 'name': 'insult', 'short': 'insult',
                     'definition': 'Comments intended to insult or demean someone.'},
                    {'key': 'IH', 'name': 'identity hate', 'short': 'identity hate',
                     'definition': 'Comments that express hatred toward a person based on identity (race, religion, gender, etc.).'}
                ]
            },
            {
                'id': 'openai',
                'name': 'OpenAI Moderation',
                'source': 'OpenAI moderation-api-release (2022)',
                'license': 'MIT',
                'paper': 'https://arxiv.org/abs/2208.03274',
                'repo': 'https://github.com/openai/moderation-api-release',
                'file': 'datasets/openai.json',
                'fileJs': 'datasets/openai.js',
                'textField': 'prompt',
                'categories': [
                    {'key': 'S', 'name': 'sexual content', 'short': 'sexual',
                     'definition': 'Content meant to arouse sexual excitement, such as the description of sexual activity, or that promotes sexual services (excluding sex education and wellness).'},
                    {'key': 'H', 'name': 'hate speech', 'short': 'hate',
                     'definition': 'Content that expresses, incites, or promotes hate based on race, gender, ethnicity, religion, nationality, sexual orientation, disability status, or caste.'},
                    {'key': 'V', 'name': 'violence', 'short': 'violence',
                     'definition': 'Content that promotes or glorifies violence or celebrates the suffering or humiliation of others.'},
                    {'key': 'HR', 'name': 'harassment', 'short': 'harassment',
                     'definition': 'Content that may be used to torment or annoy individuals in real life, or make harassment more likely to occur.'},
                    {'key': 'SH', 'name': 'self-harm', 'short': 'self-harm',
                     'definition': 'Content that promotes, encourages, or depicts acts of self-harm, such as suicide, cutting, and eating disorders.'},
                    {'key': 'S3', 'name': 'sexual/minors', 'short': 'sexual/minors',
                     'definition': 'Sexual content that includes an individual who is under 18 years old.'},
                    {'key': 'H2', 'name': 'hate/threatening', 'short': 'hate/threat.',
                     'definition': 'Hateful content that also includes violence or serious harm towards the targeted group.'},
                    {'key': 'V2', 'name': 'violence/graphic', 'short': 'violence/graphic',
                     'definition': 'Violent content that depicts death, violence, or serious physical injury in extreme graphic detail.'}
                ]
            },
            {
                'id': 'beavertails',
                'name': 'BeaverTails',
                'source': 'PKU-Alignment (2023)',
                'license': 'CC-BY-NC-4.0',
                'paper': 'https://arxiv.org/abs/2307.04657',
                'repo': 'https://huggingface.co/datasets/PKU-Alignment/BeaverTails',
                'file': 'datasets/beavertails.json',
                'fileJs': 'datasets/beavertails.js',
                'textField': 'prompt',
                'note': '330K prompt-response pairs classified across 14 harm categories by PKU.',
                'categories': [
                    {'key': 'AA', 'name': 'animal abuse', 'short': 'animal abuse',
                     'definition': 'Content that promotes or depicts cruelty, harm, or neglect toward animals.'},
                    {'key': 'CA', 'name': 'child abuse', 'short': 'child abuse',
                     'definition': 'Content involving harm, exploitation, or endangerment of minors.'},
                    {'key': 'CT', 'name': 'controversial topics/politics', 'short': 'politics',
                     'definition': 'Content involving divisive political, social, or ideological topics.'},
                    {'key': 'DS', 'name': 'discrimination/stereotype', 'short': 'discrimination',
                     'definition': 'Content that promotes discrimination, stereotypes, or injustice based on group identity.'},
                    {'key': 'DW', 'name': 'drug abuse/weapons', 'short': 'drugs/weapons',
                     'definition': 'Content promoting drug abuse, weapons, or banned substances.'},
                    {'key': 'FC', 'name': 'financial crime/theft', 'short': 'financial crime',
                     'definition': 'Content related to financial crimes, property crimes, or theft.'},
                    {'key': 'HS', 'name': 'hate speech/offensive', 'short': 'hate/offense',
                     'definition': 'Content containing hate speech or offensive language targeting groups or individuals.'},
                    {'key': 'ME', 'name': 'misinformation', 'short': 'misinfo',
                     'definition': 'Misinformation regarding ethics, laws, and safety topics.'},
                    {'key': 'NV', 'name': 'non-violent unethical behavior', 'short': 'unethical',
                     'definition': 'Content promoting unethical behavior that does not involve physical violence.'},
                    {'key': 'PV', 'name': 'privacy violation', 'short': 'privacy',
                     'definition': 'Content that violates or encourages violation of personal privacy.'},
                    {'key': 'SH', 'name': 'self-harm', 'short': 'self-harm',
                     'definition': 'Content that promotes, encourages, or depicts acts of self-harm.'},
                    {'key': 'SE', 'name': 'sexually explicit/adult', 'short': 'sexual',
                     'definition': 'Sexually explicit or adult content.'},
                    {'key': 'TC', 'name': 'terrorism/organized crime', 'short': 'terrorism',
                     'definition': 'Content related to terrorism or organized criminal activities.'},
                    {'key': 'VI', 'name': 'violence/incitement', 'short': 'violence',
                     'definition': 'Content that promotes violence, aiding and abetting, or incitement to violence.'}
                ]
            },
            {
                'id': 'saferlhf',
                'name': 'PKU-SafeRLHF',
                'source': 'PKU-Alignment (2024)',
                'license': 'CC-BY-NC-4.0',
                'paper': 'https://arxiv.org/abs/2406.15513',
                'repo': 'https://huggingface.co/datasets/PKU-Alignment/PKU-SafeRLHF',
                'file': 'datasets/saferlhf.json',
                'fileJs': 'datasets/saferlhf.js',
                'textField': 'prompt',
                'note': '265K preference pairs with 19 harm categories and 3-level severity. Extends BeaverTails with cybercrime, mental manipulation, and environmental damage.',
                'categories': [
                    {'key': 'AB', 'name': 'animal abuse', 'short': 'animal abuse',
                     'definition': 'Content that promotes or depicts cruelty, harm, or neglect toward animals.'},
                    {'key': 'CC', 'name': 'cybercrime', 'short': 'cybercrime',
                     'definition': 'Content related to hacking, phishing, malware, or other computer-based crimes.'},
                    {'key': 'CI', 'name': 'copyright issues', 'short': 'copyright',
                     'definition': 'Content involving copyright infringement or intellectual property violations.'},
                    {'key': 'DB', 'name': 'discriminatory behavior', 'short': 'discrimination',
                     'definition': 'Content promoting discrimination based on identity characteristics.'},
                    {'key': 'DR', 'name': 'drugs', 'short': 'drugs',
                     'definition': 'Content promoting drug use or production of controlled substances.'},
                    {'key': 'EC', 'name': 'economic crime', 'short': 'econ. crime',
                     'definition': 'Content related to fraud, embezzlement, or financial crimes.'},
                    {'key': 'ED', 'name': 'environmental damage', 'short': 'environment',
                     'definition': 'Content promoting or facilitating environmental harm or pollution.'},
                    {'key': 'HT', 'name': 'human trafficking', 'short': 'trafficking',
                     'definition': 'Content related to human trafficking, forced labor, or modern slavery.'},
                    {'key': 'IB', 'name': 'insulting behavior', 'short': 'insults',
                     'definition': 'Content intended to insult, demean, or belittle individuals.'},
                    {'key': 'MM', 'name': 'mental manipulation', 'short': 'manipulation',
                     'definition': 'Content designed to psychologically manipulate, gaslight, or coerce people.'},
                    {'key': 'NS', 'name': 'endangering national security', 'short': 'nat. security',
                     'definition': 'Content that threatens national security or promotes espionage.'},
                    {'key': 'PH', 'name': 'endangering public health', 'short': 'pub. health',
                     'definition': 'Content that endangers public health through misinformation or harmful advice.'},
                    {'key': 'PO', 'name': 'disrupting public order', 'short': 'pub. order',
                     'definition': 'Content that promotes disruption of public order or civil unrest.'},
                    {'key': 'PS', 'name': 'psychological harm', 'short': 'psych. harm',
                     'definition': 'Content that causes or promotes psychological distress, trauma, or emotional harm.'},
                    {'key': 'PV', 'name': 'privacy violation', 'short': 'privacy',
                     'definition': 'Content that violates or encourages violation of personal privacy.'},
                    {'key': 'PY', 'name': 'physical harm', 'short': 'physical harm',
                     'definition': 'Content that promotes or facilitates physical harm to individuals.'},
                    {'key': 'SX', 'name': 'sexual content', 'short': 'sexual',
                     'definition': 'Sexually explicit or suggestive content.'},
                    {'key': 'VL', 'name': 'violence', 'short': 'violence',
                     'definition': 'Content depicting or promoting violence.'},
                    {'key': 'WC', 'name': 'white-collar crime', 'short': 'white-collar',
                     'definition': 'Content related to corporate fraud, insider trading, or business-related crimes.'}
                ]
            },
            {
                'id': 'aegis',
                'name': 'NVIDIA Aegis v2',
                'source': 'NVIDIA (2024)',
                'license': 'CC-BY-4.0',
                'paper': 'https://arxiv.org/abs/2404.05993',
                'repo': 'https://huggingface.co/datasets/nvidia/Aegis-AI-Content-Safety-Dataset-2.0',
                'file': 'datasets/aegis.json',
                'fileJs': 'datasets/aegis.js',
                'textField': 'prompt',
                'note': '29K human-annotated prompt-response pairs across 23 safety categories.',
                'categories': [
                    {'key': 'CO', 'name': 'copyright/trademark/plagiarism', 'short': 'copyright',
                     'definition': 'Content involving copyright infringement, trademark violations, or plagiarism.'},
                    {'key': 'CP', 'name': 'criminal planning/confessions', 'short': 'criminal plan.',
                     'definition': 'Content involving planning or confessing to criminal activities.'},
                    {'key': 'CS', 'name': 'controlled/regulated substances', 'short': 'substances',
                     'definition': 'Content related to controlled or regulated substances.'},
                    {'key': 'FD', 'name': 'fraud/deception', 'short': 'fraud',
                     'definition': 'Content involving fraudulent schemes or deceptive practices.'},
                    {'key': 'GV', 'name': 'high-risk gov. decisions', 'short': 'gov. decisions',
                     'definition': 'Content related to high-risk government decision-making processes.'},
                    {'key': 'GW', 'name': 'guns/illegal weapons', 'short': 'guns/weapons',
                     'definition': 'Content related to guns and illegal weapons.'},
                    {'key': 'HA', 'name': 'harassment', 'short': 'harassment',
                     'definition': 'Content intended to harass, bully, or intimidate individuals.'},
                    {'key': 'HI', 'name': 'hate/identity hate', 'short': 'hate',
                     'definition': 'Content expressing hate based on identity characteristics.'},
                    {'key': 'IA', 'name': 'illegal activity', 'short': 'illegal act.',
                     'definition': 'Content promoting or describing general illegal activities.'},
                    {'key': 'IU', 'name': 'immoral/unethical', 'short': 'unethical',
                     'definition': 'Content promoting immoral or unethical behavior.'},
                    {'key': 'MN', 'name': 'manipulation', 'short': 'manipulation',
                     'definition': 'Content designed to manipulate or deceive people.'},
                    {'key': 'MW', 'name': 'malware', 'short': 'malware',
                     'definition': 'Content related to creating or distributing malicious software.'},
                    {'key': 'NC', 'name': 'needs caution', 'short': 'caution',
                     'definition': 'Content that requires careful handling but may not be explicitly harmful.'},
                    {'key': 'OT', 'name': 'other', 'short': 'other',
                     'definition': 'Content flagged for safety concerns not covered by other categories.'},
                    {'key': 'PF', 'name': 'profanity', 'short': 'profanity',
                     'definition': 'Content containing profane or vulgar language.'},
                    {'key': 'PI', 'name': 'PII/privacy', 'short': 'PII/privacy',
                     'definition': 'Content involving personally identifiable information or privacy violations.'},
                    {'key': 'PM', 'name': 'political/misinfo/conspiracy', 'short': 'misinfo',
                     'definition': 'Content involving political misinformation or conspiracy theories.'},
                    {'key': 'SM', 'name': 'sexual (minor)', 'short': 'sexual/minor',
                     'definition': 'Sexual content involving minors.'},
                    {'key': 'SS', 'name': 'suicide/self-harm', 'short': 'self-harm',
                     'definition': 'Content related to suicide or self-harm.'},
                    {'key': 'SX', 'name': 'sexual', 'short': 'sexual',
                     'definition': 'Sexually explicit or suggestive content.'},
                    {'key': 'TH', 'name': 'threat', 'short': 'threat',
                     'definition': 'Content containing threats of violence or harm.'},
                    {'key': 'UA', 'name': 'unauthorized advice', 'short': 'unauth. advice',
                     'definition': 'Content providing unauthorized professional advice (legal, medical, financial).'},
                    {'key': 'VL', 'name': 'violence', 'short': 'violence',
                     'definition': 'Content depicting or promoting violence.'}
                ]
            },
            {
                'id': 'airbench',
                'name': 'AIR-Bench 2024',
                'source': 'Stanford CRFM (2024)',
                'license': 'CC-BY-4.0',
                'paper': 'https://arxiv.org/abs/2407.17436',
                'repo': 'https://huggingface.co/datasets/stanford-crfm/air-bench-2024',
                'file': 'datasets/airbench.json',
                'fileJs': 'datasets/airbench.js',
                'textField': 'prompt',
                'note': '5,694 prompts derived from 8 government regulations and 16 company '
                        'policies (incl. Anthropic and OpenAI), organized in a 4-level AI-risk '
                        'taxonomy (4→16→45→314). Rolled up here to the 16 Level-2 '
                        'categories. Single-label at the leaf, so co-occurrence is near-diagonal '
                        'by design — AIR-Bench’s contribution is taxonomic breadth, '
                        'notably the CBRN/biosecurity and cyber axes absent from the other five '
                        'datasets.',
                'categories': [
                    {'key': 'CH', 'name': 'child harm', 'short': 'child harm', 'concept': 'minors',
                     'definition': 'Content sexualizing, endangering, harming, or abusing minors (AIR L2 “Child Harm”: child sexual abuse; endangerment, harm, or abuse of children).'},
                    {'key': 'CR', 'name': 'criminal activities', 'short': 'criminal', 'concept': ['substances', 'trafficking'],
                     'definition': 'Facilitating crime — illegal/regulated substances and goods (drugs), human trafficking, prostitution, sexual exploitation, and other unlawful activity (AIR L2 “Criminal Activities”).'},
                    {'key': 'DC', 'name': 'deception', 'short': 'deception', 'concept': ['fraud', 'misinfo'],
                     'definition': 'Fraud (phishing, scams, impersonation), academic dishonesty, and mis/disinformation (AIR L2 “Deception”).'},
                    {'key': 'DF', 'name': 'defamation', 'short': 'defamation', 'concept': 'other',
                     'definition': 'Generating defamatory content that damages reputation through false statements of fact (AIR L2 “Defamation”).'},
                    {'key': 'DB', 'name': 'discrimination/bias', 'short': 'discrimination', 'concept': 'hate',
                     'definition': 'Discrimination or bias against protected characteristics (AIR L2 “Discrimination/Bias”; 60 protected-characteristic combinations).'},
                    {'key': 'EH', 'name': 'economic harm', 'short': 'economic harm', 'concept': 'fraud',
                     'definition': 'Economic harms — disempowering workers, high-risk financial activities, pyramid/MLM schemes, and unfair market practices (AIR L2 “Economic Harm”).'},
                    {'key': 'FR', 'name': 'fundamental rights', 'short': 'fund. rights', 'concept': 'copyright',
                     'definition': 'Violating personal and intellectual-property rights — honor, name, portrait, reputation, and IP/trade-secret rights (AIR L2 “Fundamental Rights”).'},
                    {'key': 'HT', 'name': 'hate/toxicity', 'short': 'hate/toxicity', 'concept': ['hate', 'toxicity', 'harassment'],
                     'definition': 'Hate speech, harassment, offensive language, and perpetuating harmful beliefs (AIR L2 “Hate/Toxicity”).'},
                    {'key': 'MN', 'name': 'manipulation', 'short': 'manipulation', 'concept': 'manipulation',
                     'definition': 'Manipulating people through misrepresentation (impersonating humans, undisclosed AI-generated content) and sowing division (AIR L2 “Manipulation”).'},
                    {'key': 'OM', 'name': 'operational misuses', 'short': 'operational', 'concept': 'other',
                     'definition': 'Unsafe operational uses — advice in heavily regulated industries, automated decision-making, and autonomous unsafe operation of critical systems (AIR L2 “Operational Misuses”).'},
                    {'key': 'PU', 'name': 'political usage', 'short': 'political', 'concept': 'politics',
                     'definition': 'Political uses — deterring democratic participation, influencing politics, political persuasion, and disrupting social order (AIR L2 “Political Usage”).'},
                    {'key': 'PR', 'name': 'privacy', 'short': 'privacy', 'concept': 'privacy',
                     'definition': 'Privacy violations and disclosure of sensitive personal data (AIR L2 “Privacy”; 72 sensitive-data combinations).'},
                    {'key': 'SR', 'name': 'security risks', 'short': 'security/cyber', 'concept': 'cyber',
                     'definition': 'Cybersecurity harms across confidentiality (network intrusion, social engineering, spear phishing), integrity (malware, data tampering), and availability (network disruption) (AIR L2 “Security Risks”).'},
                    {'key': 'SH', 'name': 'self-harm', 'short': 'self-harm', 'concept': 'self-harm',
                     'definition': 'Suicidal and non-suicidal self-injury content (AIR L2 “Self-harm”).'},
                    {'key': 'SX', 'name': 'sexual content', 'short': 'sexual', 'concept': 'sexual',
                     'definition': 'Adult and erotic sexual content, monetized sexual services, and non-consensual nudity (AIR L2 “Sexual Content”).'},
                    {'key': 'VE', 'name': 'violence & extremism', 'short': 'violence/CBRN', 'concept': ['violence', 'terrorism', 'CBRN / biosecurity', 'animal'],
                     'definition': 'Violence and extremism — depicting/celebrating violence, military and warfare, support for malicious organized groups (terrorism, extremism), and Weapon Usage & Development including CBRN: bioweapons/viruses/gain-of-function, chemical, nuclear, and radiological weapons (AIR L2 “Violence & Extremism”). The only labeled dataset in this tool whose taxonomy reaches the CBRN/biosecurity axis.'}
                ]
            },
            {
                'id': 'harmbench',
                'name': 'HarmBench',
                'source': 'CAIS (2024)',
                'license': 'MIT',
                'paper': 'https://arxiv.org/abs/2402.04249',
                'repo': 'https://github.com/centerforaisafety/HarmBench',
                'file': 'datasets/harmbench.json',
                'fileJs': 'datasets/harmbench.js',
                'textField': 'prompt',
                'note': 'Automated-red-teaming BEHAVIOR set (CAIS, Feb 2024): 400 harmful '
                        'instructions used to test attack and refusal robustness, each labeled '
                        'with exactly one of seven semantic categories. Single-label by '
                        'construction (100% exclusivity, ~0% co-occurrence). Full behavior text '
                        'is included (already public on GitHub, MIT). Behaviors are elicitation '
                        'prompts — requests, not weapon recipes. Its “chemical_biological” '
                        'category gives a third MEASURED column on the CBRN/biosecurity axis, '
                        'alongside AIR-Bench and AILuminate.',
                'categories': [
                    {'key': 'CB', 'name': 'chemical & biological', 'short': 'chem/bio', 'concept': 'CBRN / biosecurity',
                     'definition': 'Behaviors eliciting instructions or uplift for chemical or biological weapons and agents (HarmBench semantic category “chemical_biological”). HarmBench’s slice of the CBRN/biosecurity axis.'},
                    {'key': 'CY', 'name': 'cybercrime & intrusion', 'short': 'cyber', 'concept': 'cyber',
                     'definition': 'Behaviors eliciting hacking, malware, or unauthorized-intrusion assistance (HarmBench “cybercrime_intrusion”).'},
                    {'key': 'IL', 'name': 'illegal activities', 'short': 'illegal', 'concept': ['substances', 'trafficking'],
                     'definition': 'Behaviors eliciting general illegal activity — drugs, weapons, theft, smuggling (HarmBench “illegal”).'},
                    {'key': 'MD', 'name': 'misinformation & disinformation', 'short': 'misinfo', 'concept': 'misinfo',
                     'definition': 'Behaviors eliciting false or misleading content — propaganda, fabricated claims (HarmBench “misinformation_disinformation”).'},
                    {'key': 'HB', 'name': 'harassment & bullying', 'short': 'harassment', 'concept': 'harassment',
                     'definition': 'Behaviors eliciting harassment, bullying, or targeted abuse (HarmBench “harassment_bullying”).'},
                    {'key': 'CP', 'name': 'copyright violations', 'short': 'copyright', 'concept': 'copyright',
                     'definition': 'Behaviors eliciting verbatim reproduction of copyrighted text — song lyrics, book passages (HarmBench “copyright”).'},
                    {'key': 'HM', 'name': 'general harm', 'short': 'harmful', 'concept': 'other',
                     'definition': 'Behaviors causing other harms not covered by the six specific categories (HarmBench “harmful”).'}
                ]
            },
            {
                'id': 'ailuminate',
                'name': 'MLCommons AILuminate v1.0',
                'source': 'MLCommons (2025)',
                'license': 'CC-BY-4.0',
                'paper': 'https://arxiv.org/abs/2503.05731',
                'repo': 'https://github.com/mlcommons/ailuminate',
                'file': 'datasets/ailuminate.json',
                'fileJs': 'datasets/ailuminate.js',
                'textField': 'prompt',
                'note': 'Public DEMO prompt set: 1,200 human-written prompts (a 10% subset of the '
                        'practice corpus, CC-BY-4.0) labeled across the 12-hazard AIRR taxonomy. '
                        'Single-label per prompt, so co-occurrence is near-diagonal. Its keystone '
                        'contribution is a dedicated, MEASURED “Indiscriminate Weapons (CBRNE)” '
                        'hazard — chemical/biological/radiological/nuclear/explosive — the explicit '
                        'CBRN category the five legacy datasets lack.',
                'categories': [
                    {'key': 'VC', 'name': 'violent crimes', 'short': 'violent crime', 'concept': 'violence',
                     'definition': 'Prompts seeking to enable, encourage, or endorse violent crimes (AILuminate hazard “vcr”, Physical Hazards).'},
                    {'key': 'SR', 'name': 'sex-related crimes', 'short': 'sex crimes', 'concept': ['sexual', 'trafficking'],
                     'definition': 'Prompts seeking to enable sex-related crimes — sexual assault, harassment, trafficking (AILuminate hazard “src”, Physical Hazards).'},
                    {'key': 'CE', 'name': 'child sexual exploitation', 'short': 'child exploit.', 'concept': 'minors',
                     'definition': 'Prompts seeking to enable, encourage, or endorse the sexual abuse or exploitation of children (AILuminate hazard “cse”, Physical Hazards).'},
                    {'key': 'SS', 'name': 'suicide & self-harm', 'short': 'self-harm', 'concept': 'self-harm',
                     'definition': 'Prompts seeking to enable or encourage suicide or self-harm (AILuminate hazard “ssh”, Physical Hazards).'},
                    {'key': 'IW', 'name': 'indiscriminate weapons (CBRNE)', 'short': 'CBRNE', 'concept': 'CBRN / biosecurity',
                     'definition': 'Prompts seeking to enable the creation or use of indiscriminate weapons — chemical, biological, radiological, nuclear, and high-yield explosive (AILuminate hazard “iwp”, Physical Hazards). The explicit, measured CBRN category.'},
                    {'key': 'IP', 'name': 'intellectual property violations', 'short': 'IP', 'concept': 'copyright',
                     'definition': 'Prompts seeking to violate intellectual-property rights (AILuminate hazard “ipv”, Non-Physical Hazards).'},
                    {'key': 'DF', 'name': 'defamation', 'short': 'defamation', 'concept': 'other',
                     'definition': 'Prompts seeking to create defamatory content about real, living people (AILuminate hazard “dfm”, Non-Physical Hazards).'},
                    {'key': 'NC', 'name': 'non-violent crimes', 'short': 'non-violent crime', 'concept': 'other',
                     'definition': 'Prompts seeking to enable, encourage, or endorse non-violent crimes (AILuminate hazard “ncr”, Non-Physical Hazards).'},
                    {'key': 'HT', 'name': 'hate', 'short': 'hate', 'concept': 'hate',
                     'definition': 'Prompts that demean or dehumanize people on the basis of protected characteristics (AILuminate hazard “hte”, Non-Physical Hazards).'},
                    {'key': 'PR', 'name': 'privacy violations', 'short': 'privacy', 'concept': 'privacy',
                     'definition': 'Prompts seeking to violate the privacy or security of private individuals (AILuminate hazard “prv”, Non-Physical Hazards).'},
                    {'key': 'SA', 'name': 'specialized advice', 'short': 'spec. advice', 'concept': 'other',
                     'definition': 'Prompts seeking unqualified specialized advice — electoral, financial, health, or legal (AILuminate hazard “spc”, Contextual Hazards; sub-codes rolled up here).'},
                    {'key': 'SX', 'name': 'sexual content', 'short': 'sexual', 'concept': 'sexual',
                     'definition': 'Prompts seeking pornographic or otherwise explicit sexual content (AILuminate hazard “sxc”, Contextual Hazards).'}
                ]
            },
            {
                'id': 'anthropic-cc',
                'name': 'Anthropic Constitutional Classifiers',
                'source': 'Anthropic (2025)',
                'license': 'N/A — taxonomy only',
                'certainty': 'taxonomy-only',
                'taxonomyOnly': True,
                'rows': None,
                'paper': 'https://arxiv.org/abs/2501.18837',
                'repo': 'https://www.anthropic.com/research/constitutional-classifiers',
                'textField': 'prompt',
                'note': 'Frontier DEPLOYMENT classifiers that intercept model inputs and outputs in '
                        'real time. The category list is published, but there is NO public '
                        'row-level corpus — so this layer carries no counts, co-occurrence, or '
                        'statistics. It appears in the taxonomy crosswalk (Rosetta) and the '
                        'evolution timeline (Drift) ONLY, badged “taxonomy only”. Focus is CBRN: '
                        'chemical, biological, radiological, and nuclear weapons (Constitutional '
                        'Classifiers, arXiv 2501.18837; next-gen “Constitutional Classifiers++”, '
                        'Jan 2026; biosecurity safeguards at red.anthropic.com/2025/biorisk).',
                'categories': [
                    {'key': 'CW', 'name': 'chemical weapons', 'short': 'chemical', 'concept': 'CBRN / biosecurity',
                     'sourceUrl': 'https://arxiv.org/abs/2501.18837',
                     'definition': 'Synthesis or acquisition of chemical weapons and Schedule 1 chemicals. The original Constitutional Classifiers were trained on a chemical-weapons constitution (Anthropic, arXiv 2501.18837).'},
                    {'key': 'BW', 'name': 'biological weapons', 'short': 'biological', 'concept': 'CBRN / biosecurity',
                     'sourceUrl': 'https://red.anthropic.com/2025/biorisk/',
                     'definition': 'Uplift toward dangerous biological agents — virology, synthetic biology, and genetic-engineering knowledge — the focus of Anthropic’s ASL-3 biosecurity safeguards (red.anthropic.com/2025/biorisk).'},
                    {'key': 'RW', 'name': 'radiological weapons', 'short': 'radiological', 'concept': 'CBRN / biosecurity',
                     'sourceUrl': 'https://www.anthropic.com/research/next-generation-constitutional-classifiers',
                     'definition': 'Acquisition or use of radiological weapons (e.g. dirty bombs); part of the CBRN scope guarded by next-generation Constitutional Classifiers (Anthropic, Jan 2026).'},
                    {'key': 'NW', 'name': 'nuclear weapons', 'short': 'nuclear', 'concept': 'CBRN / biosecurity',
                     'sourceUrl': 'https://www.anthropic.com/activating-asl3-report',
                     'definition': 'Design or acquisition of nuclear weapons; part of the CBRN scope guarded by Anthropic’s deployment classifiers and ASL-3 protections (Activating ASL-3 report, 2025).'}
                ]
            }
        ]
    }

    # Preserve hand-annotated `concept` fields (used by the Rosetta Stone and
    # Drift timeline) from the existing registry.json. generate_registry() does
    # not author concepts for the five legacy datasets, so without this merge a
    # regeneration would silently wipe the entire crosswalk. New entries above
    # carry their concepts inline and are left untouched.
    reg_path = os.path.join(DATASETS_DIR, 'registry.json')
    if os.path.exists(reg_path):
        with open(reg_path) as f:
            old_reg = json.load(f)
        old_concepts = {}
        for ds in old_reg.get('datasets', []):
            for cat in ds.get('categories', []):
                if 'concept' in cat:
                    old_concepts[(ds['id'], cat['key'])] = cat['concept']
        restored = 0
        for ds in registry['datasets']:
            for cat in ds['categories']:
                if 'concept' not in cat and (ds['id'], cat['key']) in old_concepts:
                    cat['concept'] = old_concepts[(ds['id'], cat['key'])]
                    restored += 1
        print(f'  Preserved {restored} concept fields from existing registry.json')

    # Write registry (Aegis categories will be updated after processing)
    json_path = os.path.join(DATASETS_DIR, 'registry.json')
    js_path = os.path.join(DATASETS_DIR, 'registry.js')

    print(f'  Writing {json_path}...')
    with open(json_path, 'w') as f:
        json.dump(registry, f, indent=2)

    print(f'  Writing {js_path}...')
    with open(js_path, 'w') as f:
        f.write('var datasetRegistry = ')
        json.dump(registry, f, indent=2)
        f.write(';\n')

    print('  Done: registry')
    return registry


def update_registry_aegis_categories(cats_info):
    """Update registry with discovered Aegis categories."""
    json_path = os.path.join(DATASETS_DIR, 'registry.json')
    with open(json_path) as f:
        registry = json.load(f)

    for ds in registry['datasets']:
        if ds['id'] == 'aegis':
            ds['categories'] = cats_info

    with open(json_path, 'w') as f:
        json.dump(registry, f, indent=2)

    js_path = os.path.join(DATASETS_DIR, 'registry.js')
    with open(js_path, 'w') as f:
        f.write('var datasetRegistry = ')
        json.dump(registry, f, indent=2)
        f.write(';\n')

    print('  Updated registry with Aegis categories')


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1].lower()
    ensure_datasets_dir()

    if cmd == 'openai':
        process_openai()
    elif cmd == 'beavertails':
        process_beavertails()
    elif cmd == 'aegis':
        process_aegis()
    elif cmd == 'jigsaw':
        process_jigsaw()
    elif cmd == 'saferlhf':
        process_saferlhf()
    elif cmd == 'airbench':
        process_airbench()
    elif cmd == 'ailuminate':
        process_ailuminate()
    elif cmd == 'harmbench':
        process_harmbench()
    elif cmd == 'registry':
        generate_registry()
    elif cmd == 'stats':
        compute_stats()
    elif cmd == 'xref':
        build_xref()
    elif cmd == 'fuzzy':
        build_fuzzy_xref()
    elif cmd == 'all':
        generate_registry()
        process_openai()
        process_jigsaw()
        process_beavertails()
        process_saferlhf()
        process_aegis()
        process_airbench()
        process_ailuminate()
        process_harmbench()
        compute_stats()
        build_xref()
    else:
        print(f'Unknown command: {cmd}')
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
