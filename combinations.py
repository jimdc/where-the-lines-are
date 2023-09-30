import json
import matplotlib.pyplot as plt
import seaborn as sns
from itertools import chain
from collections import defaultdict, Counter
checkbox_label_mapping = {
    'S': 'sexual',
    'H': 'hate',
    'V': 'violence',
    'HR': 'harassment',
    'SH': 'self-harm',
    'S3': 'sexual/minors',
    'H2': 'hate/threatening',
    'V2': 'violence/graphic'
}

with open('samples-1680.jsonl', 'r') as f:
    lines = f.readlines()
    data = [json.loads(line) for line in lines]
    
# Define all possible keys
all_keys = ['S', 'H', 'V', 'HR', 'SH', 'S3', 'H2', 'V2']

# Initialize combinations as a defaultdict
combinations = defaultdict(int)

for item in data:
    keys = tuple(sorted(key for key in all_keys if item.get(key, 0) == 1))  # to ensure consistent ordering and count absent keys as 0
    combinations[keys] += 1

# Extract all unique keys from the data (excluding 'prompt')
all_keys = set(chain.from_iterable([item.keys() for item in data])) - {'prompt'}

counted_combinations = Counter(combinations)
# Convert the Counter object to a list of items and sort it by value (frequency) in descending order
sorted_combinations = sorted(counted_combinations.items(), key=lambda x: x[1], reverse=True)

# Unzip the sorted items back to labels and values
labels, values = zip(*sorted_combinations)

# Identify combinations where all values are 0
zero_value_combinations = [tuple(sorted(k for k, v in item.items() if v == 0 and k != 'prompt')) for item in data]

# Count occurrences of each zero value combination
zero_value_counts = Counter(zero_value_combinations)

# Add zero value combinations to the counted_combinations dictionary
counted_combinations.update(zero_value_counts)
    
# Re-sort after adding the missing combinations
sorted_combinations = sorted(counted_combinations.items(), key=lambda x: x[1], reverse=True)
labels, values = zip(*sorted_combinations)

# Filter out 'prompt' from the labels
str_labels = ['+'.join([key for key in label if key != 'prompt']) for label in labels]

fig, ax = plt.subplots(figsize=(12, 10))

# Generate the barplot
bars = sns.barplot(x=str_labels, y=list(values), ax=ax, order=str_labels)

# Annotate each bar with its value and print to console
for idx, bar in enumerate(bars.patches):
    height = bar.get_height()
    label = str_labels[idx]
    print(f"Combination: {label}, Count: {int(height)}")  # Printing to the console
    ax.text(bar.get_x() + bar.get_width() / 2, height + 0.5, 
            int(height), ha='center', va='bottom', fontsize=9)


ax.set_xlabel('Combinations')
ax.set_ylabel('Frequency')
ax.set_title('Frequency of Key Combinations Ordered by Frequency')
plt.xticks(rotation=90)
plt.subplots_adjust(left=0.15)
plt.tight_layout()

# Create legend labels
legend_labels = [f"{key}: {value}" for key, value in checkbox_label_mapping.items()]

# Add the legend to the top-right corner
plt.legend(legend_labels, title="Mappings", loc="upper right")
plt.show()