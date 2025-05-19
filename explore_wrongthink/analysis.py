import json
import itertools
from collections import Counter
from typing import List, Dict, Tuple

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns

# Keys used in the dataset
KEYS = ['S', 'H', 'V', 'HR', 'SH', 'S3', 'H2', 'V2']


def load_data(path: str = 'dataset.js') -> List[Dict[str, int]]:
    """Load dataset from JS file containing a JSON array."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read().strip()
    prefix = 'const dataset ='
    if content.startswith(prefix):
        content = content[len(prefix):].strip()
    if content.endswith(';'):
        content = content[:-1].strip()
    return json.loads(content)


def count_single_categories(data: List[Dict[str, int]]) -> Counter:
    """Count frequency of each category flagged as 1."""
    counts: Counter = Counter()
    for item in data:
        for key in KEYS:
            if item.get(key, 0) == 1:
                counts[key] += 1
    return counts


def count_pairwise(data: List[Dict[str, int]]) -> Counter:
    """Count pairwise co-occurrence of categories."""
    pair_counts: Counter = Counter()
    for item in data:
        for a, b in itertools.combinations(KEYS, 2):
            if item.get(a, 0) == 1 and item.get(b, 0) == 1:
                pair_counts[(a, b)] += 1
    return pair_counts


def plot_single_counts(counts: Counter) -> None:
    """Plot a bar chart of single category frequencies."""
    labels, values = zip(*sorted(counts.items(), key=lambda x: x[1], reverse=True))
    sns.barplot(x=list(labels), y=list(values))
    plt.xlabel('Category')
    plt.ylabel('Count of value=1')
    plt.title('Frequency of single categories')
    plt.tight_layout()
    plt.show()


def plot_pair_heatmap(pair_counts: Counter) -> None:
    """Plot heatmap of pairwise co-occurrences."""
    matrix = np.zeros((len(KEYS), len(KEYS)), dtype=int)
    key_to_idx = {k: i for i, k in enumerate(KEYS)}
    for (a, b), count in pair_counts.items():
        i, j = key_to_idx[a], key_to_idx[b]
        matrix[i, j] = count
        matrix[j, i] = count
    sns.heatmap(matrix, annot=True, fmt='d', cmap='Blues', xticklabels=KEYS, yticklabels=KEYS)
    plt.title('Pairwise co-occurrence counts')
    plt.tight_layout()
    plt.show()


def run_analysis(path: str = 'dataset.js') -> None:
    """Run full analysis and produce plots."""
    data = load_data(path)
    single_counts = count_single_categories(data)
    print('Single category counts:')
    for key, value in single_counts.most_common():
        print(f'{key}: {value}')
    plot_single_counts(single_counts)
    pair_counts = count_pairwise(data)
    print('\nTop pairwise co-occurrences:')
    for pair, cnt in pair_counts.most_common(10):
        print(f'{pair[0]} + {pair[1]}: {cnt}')
    plot_pair_heatmap(pair_counts)


if __name__ == '__main__':
    run_analysis()
