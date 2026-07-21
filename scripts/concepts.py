"""Concept crosswalk loader for the embedding-clustering precompute pipeline.

registry.json's `concept` field on each category is the same cross-taxonomy
grouping the client already uses for the Rosetta Stone table, Drift timeline,
and Consensus panel (see index.html's computeCrossDatasetAgreement). This
module is the Python-side equivalent, so cluster/noise-lens measure purity
against one shared vocabulary instead of three taxonomies' raw category codes
(8 OpenAI codes, 23 Aegis codes, 19 SafeRLHF codes, ...) — otherwise every
cluster looks "impure" purely because the codes don't line up.
"""

import json
import os

DATASETS_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'datasets')


def load_registry(datasets_dir=DATASETS_DIR):
    with open(os.path.join(datasets_dir, 'registry.json')) as f:
        return json.load(f)


def category_concepts(registry):
    """{dataset_id: {category_key: [concept, ...]}} from registry.json's `concept` field."""
    out = {}
    for ds in registry['datasets']:
        cmap = {}
        for cat in ds.get('categories', []):
            concept = cat.get('concept')
            if not concept:
                continue
            cmap[cat['key']] = concept if isinstance(concept, list) else [concept]
        out[ds['id']] = cmap
    return out


def row_concepts(flagged_keys, cat_concepts_for_dataset):
    """Union of concepts for a row given its flagged category keys."""
    concepts = set()
    for k in flagged_keys:
        for c in cat_concepts_for_dataset.get(k, ()):
            concepts.add(c)
    return concepts
