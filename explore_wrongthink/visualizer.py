import json
from collections import defaultdict, Counter
from typing import Dict

import matplotlib.pyplot as plt
import seaborn as sns


CHECKBOX_LABEL_MAPPING: Dict[str, str] = {
    'S': 'sexual',
    'H': 'hate',
    'V': 'violence',
    'HR': 'harassment',
    'SH': 'self-harm',
    'S3': 'sexual/minors',
    'H2': 'hate/threatening',
    'V2': 'violence/graphic'
}


def plot_combinations(jsonl_path: str = 'samples-1680.jsonl') -> None:
    """Plot histogram of combination frequencies from a JSONL file."""
    with open(jsonl_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    data = [json.loads(line) for line in lines]

    all_keys = ['S', 'H', 'V', 'HR', 'SH', 'S3', 'H2', 'V2']
    combinations = defaultdict(int)
    for item in data:
        keys = tuple(sorted(key for key in all_keys if item.get(key, 0) == 1))
        combinations[keys] += 1

    counted_combinations = Counter(combinations)
    zero_value_combinations = [
        tuple(sorted(k for k, v in item.items() if v == 0 and k != 'prompt'))
        for item in data
    ]
    zero_value_counts = Counter(zero_value_combinations)
    counted_combinations.update(zero_value_counts)

    sorted_combinations = sorted(counted_combinations.items(), key=lambda x: x[1], reverse=True)
    labels, values = zip(*sorted_combinations)
    str_labels = ['+'.join([key for key in label if key != 'prompt']) for label in labels]

    fig, ax = plt.subplots(figsize=(12, 10))
    bars = sns.barplot(x=str_labels, y=list(values), ax=ax, order=str_labels)

    for idx, bar in enumerate(bars.patches):
        height = bar.get_height()
        label = str_labels[idx]
        print(f"Combination: {label}, Count: {int(height)}")
        ax.text(bar.get_x() + bar.get_width() / 2, height + 0.5, int(height), ha='center', va='bottom', fontsize=9)

    ax.set_xlabel('Combinations')
    ax.set_ylabel('Frequency')
    ax.set_title('Frequency of Key Combinations Ordered by Frequency')
    plt.xticks(rotation=90)
    plt.subplots_adjust(left=0.15)
    plt.tight_layout()

    legend_labels = [f"{key}: {value}" for key, value in CHECKBOX_LABEL_MAPPING.items()]
    plt.legend(legend_labels, title="Mappings", loc="upper right")
    plt.show()


if __name__ == '__main__':
    plot_combinations()
