import json
import argparse


def main(in_path, out_path):
    with open(in_path, "r", encoding="utf-8") as f:
        data = [json.loads(line) for line in f]

    with open(out_path, "w", encoding="utf-8") as out:
        out.write("const dataset = ")
        json.dump(data, out, ensure_ascii=False, indent=2)
        out.write(";\n")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Convert JSONL to dataset.js")
    parser.add_argument(
        "--input", default="samples-1680.jsonl",
        help="Path to JSONL file")
    parser.add_argument(
        "--output", default="dataset.js",
        help="Output JS file")
    args = parser.parse_args()
    main(args.input, args.output)
