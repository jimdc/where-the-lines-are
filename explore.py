import argparse

from explore_wrongthink import analysis, visualizer


def main() -> None:
    parser = argparse.ArgumentParser(description="Explore Wrongthink utilities")
    subparsers = parser.add_subparsers(dest="command", required=True)


    combos = subparsers.add_parser("combinations", help="Plot combination histogram")
    combos.add_argument("--input", default="samples-1680.jsonl", help="JSONL input file")

    ana = subparsers.add_parser("analysis", help="Run category analysis")
    ana.add_argument("--dataset", default="dataset.js", help="Path to dataset.js")

    args = parser.parse_args()

    if args.command == "combinations":
        visualizer.plot_combinations(args.input)
    elif args.command == "analysis":
        analysis.run_analysis(args.dataset)


if __name__ == "__main__":
    main()
