#!/usr/bin/env python3
"""
Preprocessing pipeline for explore-wrongthink datasets.

Downloads from HuggingFace, normalizes to {textField: str, key1: 0|1, ...},
outputs JSON + JS wrappers for browser consumption.

Usage:
    python scripts/preprocess.py openai        # reformat existing data
    python scripts/preprocess.py beavertails   # download + normalize
    python scripts/preprocess.py aegis         # download + normalize
    python scripts/preprocess.py jigsaw        # download + normalize
    python scripts/preprocess.py saferlhf      # download + normalize
    python scripts/preprocess.py registry      # generate registry.json + .js
    python scripts/preprocess.py all           # run all of the above
"""

import json
import os
import sys

DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'datasets')


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
    """Download and normalize NVIDIA Aegis v2 dataset."""
    print('Processing NVIDIA Aegis v2 dataset...')
    from datasets import load_dataset

    print('  Downloading from HuggingFace (nvidia/Aegis-AI-Content-Safety-Dataset-2.0)...')
    ds = load_dataset('nvidia/Aegis-AI-Content-Safety-Dataset-2.0', split='train')
    print(f'  Downloaded {len(ds)} rows')

    sample = ds[0]
    print(f'  Sample keys: {list(sample.keys())}')
    print(f'  Sample text_type: {sample.get("text_type", "N/A")}')
    print(f'  Sample violated_categories: {sample.get("violated_categories", "N/A")}')
    print(f'  Sample labels_0: {sample.get("labels_0", "N/A")}')
    print(f'  Sample labels_1: {sample.get("labels_1", "N/A")}')

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
        # Try the first string field
        for k, v in sample.items():
            if isinstance(v, str) and len(v) > 50:
                text_field = k
                break

    print(f'  Using text field: {text_field}')

    data = []
    skipped = 0

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

        data.append(entry)

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
    """Download and normalize PKU-SafeRLHF dataset."""
    print('Processing PKU-SafeRLHF dataset...')
    from datasets import load_dataset

    print('  Downloading from HuggingFace (PKU-Alignment/PKU-SafeRLHF)...')
    ds = load_dataset('PKU-Alignment/PKU-SafeRLHF', split='train')
    print(f'  Downloaded {len(ds)} rows')

    sample = ds[0]
    print(f'  Sample keys: {list(sample.keys())}')

    # SafeRLHF has response_0_harm_category and response_1_harm_category dicts
    # with 19 boolean keys each. We use response_0 categories (primary response).
    # Each row is a prompt with two responses — we classify by the LESS safe response
    # to capture the broadest category coverage per prompt.

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

        # Deduplicate: same prompt can appear multiple times with different responses
        # Merge categories across all appearances (union of harm flags)
        prompt_hash = hash(prompt_clean)
        if prompt_hash in seen_prompts:
            # Find existing entry and merge
            for existing in reversed(data):
                if existing['prompt'] == prompt_clean:
                    # OR the categories from both responses
                    cat0 = row.get('response_0_harm_category', {})
                    cat1 = row.get('response_1_harm_category', {})
                    for orig_key, short_key in CAT_MAP.items():
                        v0 = 1 if cat0.get(orig_key, False) else 0
                        v1 = 1 if cat1.get(orig_key, False) else 0
                        existing[short_key] = max(existing[short_key], v0, v1)
                    break
            continue

        seen_prompts.add(prompt_hash)
        entry = {'prompt': prompt_clean}

        # Union of harm categories across both responses
        cat0 = row.get('response_0_harm_category', {})
        cat1 = row.get('response_1_harm_category', {})

        for orig_key, short_key in CAT_MAP.items():
            v0 = 1 if cat0.get(orig_key, False) else 0
            v1 = 1 if cat1.get(orig_key, False) else 0
            entry[short_key] = max(v0, v1)

        data.append(entry)

        if (i + 1) % 50000 == 0:
            print(f'  Processed {i + 1} rows...')

    print(f'  Final: {len(data)} rows ({skipped} skipped, deduped from {len(ds)})')
    write_json_and_js('saferlhf', data)


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
            }
        ]
    }

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
    elif cmd == 'registry':
        generate_registry()
    elif cmd == 'all':
        generate_registry()
        process_openai()
        process_jigsaw()
        process_beavertails()
        process_saferlhf()
        process_aegis()
    else:
        print(f'Unknown command: {cmd}')
        print(__doc__)
        sys.exit(1)


if __name__ == '__main__':
    main()
