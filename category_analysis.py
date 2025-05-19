import json
import itertools
import numpy as np
import seaborn as sns
import matplotlib.pyplot as plt
from collections import Counter

# Keys used in the dataset
KEYS = ['S', 'H', 'V', 'HR', 'SH', 'S3', 'H2', 'V2']


def load_data(path='dataset.js'):
    """Load dataset from JS file containing a JSON array."""
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read().strip()

    # Remove the "const dataset =" prefix if present
    prefix = 'const dataset ='
    if content.startswith(prefix):
        content = content[len(prefix):].strip()

    # Remove the trailing semicolon
    if content.endswith(';'):
        content = content[:-1].strip()

    return json.loads(content)


def count_single_categories(data):
    """Count frequency of each category flagged as 1."""
    counts = Counter()
    for item in data:
        for key in KEYS:
            if item.get(key, 0) == 1:
                counts[key] += 1
    return counts


def count_pairwise(data):
    """Count pairwise co-occurrence of categories."""
    pair_counts = Counter()
    for item in data:
        for a, b in itertools.combinations(KEYS, 2):
            if item.get(a, 0) == 1 and item.get(b, 0) == 1:
                pair_counts[(a, b)] += 1
    return pair_counts


def plot_single_counts(counts):
    labels, values = zip(*sorted(counts.items(), key=lambda x: x[1], reverse=True))
    sns.barplot(x=list(labels), y=list(values))
    plt.xlabel('Category')
    plt.ylabel('Count of value=1')
    plt.title('Frequency of single categories')
    plt.tight_layout()
    plt.show()


def plot_pair_heatmap(pair_counts):
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


def main():
    data = load_data()
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
    main()
