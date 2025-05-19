import json
import logging
import os
from pathlib import Path
from typing import List, Dict

from flask import Flask, request, render_template_string


def load_dataset(path: str) -> List[Dict]:
    """Load the dataset.js file produced by jsonl_to_js."""
    with open(path, "r", encoding="utf-8") as f:
        content = f.read().strip()

    prefix = "const dataset ="
    if content.startswith(prefix):
        content = content[len(prefix):].strip()
    if content.endswith(";"):
        content = content[:-1].strip()
    return json.loads(content)


def create_app(dataset_path: str = "dataset.js") -> Flask:
    """Create and configure the Flask application."""
    root = Path(__file__).resolve().parent.parent
    app = Flask(__name__, static_folder=str(root))
    logging.basicConfig(level=logging.DEBUG)

    checkbox_label_mapping = {
        'S': 'sexual (S)',
        'H': 'hate (H)',
        'V': 'violence (V)',
        'HR': 'harassment (HR)',
        'SH': 'self-harm (SH)',
        'S3': 'sexual/minors (S3)',
        'H2': 'hate/threatening (H2)',
        'V2': 'violence/graphic (V2)'
    }
    checkboxes = list(checkbox_label_mapping.keys())

    @app.route('/', methods=['GET', 'POST'])
    def index():
        checkbox_values = {checkbox: 'Any' for checkbox in checkboxes}
        matching_lines: List[Dict] = []

        if request.method == 'POST':
            for checkbox in checkboxes:
                checkbox_values[checkbox] = request.form.get(f'radio-{checkbox}', 'Any')
                logging.debug("Checkbox %s value: %s", checkbox, checkbox_values[checkbox])

            for item in load_dataset(dataset_path):
                if all(
                    str(item.get(checkbox, 'N/A')) == checkbox_values[checkbox] or
                    checkbox_values[checkbox] == 'Any' or
                    (checkbox_values[checkbox] == '0 or N/A' and str(item.get(checkbox, 'N/A')) in ['0', 'N/A'])
                    for checkbox in checkboxes
                ):
                    keys_0, keys_1, keys_na = [], [], []
                    for checkbox in checkboxes:
                        value = str(item.get(checkbox, 'N/A'))
                        if value == '0':
                            keys_0.append(checkbox_label_mapping[checkbox])
                        elif value == '1':
                            keys_1.append(checkbox_label_mapping[checkbox])
                        else:
                            keys_na.append(checkbox_label_mapping[checkbox])
                    item = dict(item)  # copy
                    item['keys_0'] = ', '.join(keys_0)
                    item['keys_1'] = ', '.join(keys_1)
                    item['keys_na'] = ', '.join(keys_na)
                    matching_lines.append(item)

        return render_template_string(
            TEMPLATE,
            checkboxes=checkboxes,
            checkbox_values=checkbox_values,
            matching_lines=matching_lines,
            checkbox_label_mapping=checkbox_label_mapping
        )

    @app.route('/subset-client')
    def subset_client():
        return app.send_static_file('subset-client.html')

    return app


TEMPLATE = """
        <h1> Explore-wrongthink </h1>
        <style>
            h1, h2 {
                text-align: center;
            }
            table {
                width: 100%;
                table-layout: fixed;
            }
            th, td {
                word-wrap: break-word;
            }
        </style>
        <script>
            function setAllRadioButtons(value) {
                var radios = document.querySelectorAll('input[type="radio"]');
                radios.forEach(function(radio) {
                    if (radio.value === value) {
                        radio.checked = true;
                    }
                });
            }
        </script>
        <form method="POST">
        <table border="1">
            <thead>
                <tr>
                    <th>Classification key</th>
<th><button onclick="setAllRadioButtons('0')">Set all values</button> = 0</th>
<th><button onclick="setAllRadioButtons('1')">Set all values</button> = 1</th>
<th><button onclick="setAllRadioButtons('Any')">Set all values</button> = Any</th>
<th><button onclick="setAllRadioButtons('0 or N/A')">Set all values</button> = 0 or N/A</th>
                    <th>Value on last generation</th>
                </tr>
            </thead>
            <tbody>
{% for checkbox in checkboxes %}
                <tr>
                    <td><label>{{ checkbox_label_mapping[checkbox] }}</label></td>
                    <td><input type="radio" name="radio-{{ checkbox }}" value="0" {% if checkbox_values[checkbox] == '0' %} checked {% endif %}>0</td>
                    <td><input type="radio" name="radio-{{ checkbox }}" value="1" {% if checkbox_values[checkbox] == '1' %} checked {% endif %}>1</td>
                    <td><input type="radio" name="radio-{{ checkbox }}" value="Any" {% if checkbox_values[checkbox] == 'Any' %} checked {% endif %}>Any</td>
                    <td><input type="radio" name="radio-{{ checkbox }}" value="0 or N/A" {% if checkbox_values[checkbox] == '0 or N/A' %} checked {% endif %}>0 or N/A</td>
                    <td>{{ checkbox_values[checkbox] if checkbox_values[checkbox] != 'Any' else 'N/A' }}</td>
                </tr>
{% endfor %}
            </tbody>
        </table>
        <br><input type="submit" value="Generate subset" style="font-size:18px;padding:10px;">
        </form>
        <h2>{{ matching_lines | length }} Matching lines:</h2>
        <table border="1">
            <thead>
                <tr>
                    <th>Prompt</th>
                    <th>Value = 0</th>
                    <th>Value = 1</th>
                    <th>Value = N/A</th>
                </tr>
            </thead>
            <tbody>
                {% for line in matching_lines %}
                <tr>
                    <td>{{ line.get('prompt', 'N/A') }}</td>
                    <td>{{ line.keys_0 }}</td>
                    <td>{{ line.keys_1 }}</td>
                    <td>{{ line.keys_na }}</td>
                </tr>
{% endfor %}
            </tbody>
        </table>
"""


def main() -> None:
    app = create_app()
    app.run(debug=True)


if __name__ == '__main__':
    main()
