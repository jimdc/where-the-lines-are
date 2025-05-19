import argparse

from explore_wrongthink import analysis, visualizer, webapp


def main() -> None:
    parser = argparse.ArgumentParser(description="Explore Wrongthink utilities")
    subparsers = parser.add_subparsers(dest="command", required=True)

    subset = subparsers.add_parser("subset", help="Run dataset subset web app")
    subset.add_argument("--dataset", default="dataset.js", help="Path to dataset.js")
    subset.add_argument("--host", default="127.0.0.1", help="Host to bind")
    subset.add_argument("--port", type=int, default=5000, help="Port to bind")

    combos = subparsers.add_parser("combinations", help="Plot combination histogram")
    combos.add_argument("--input", default="samples-1680.jsonl", help="JSONL input file")

    ana = subparsers.add_parser("analysis", help="Run category analysis")
    ana.add_argument("--dataset", default="dataset.js", help="Path to dataset.js")

    args = parser.parse_args()

    if args.command == "subset":
        app = webapp.create_app(args.dataset)
        app.run(host=args.host, port=args.port, debug=True)
    elif args.command == "combinations":
        visualizer.plot_combinations(args.input)
    elif args.command == "analysis":
        analysis.run_analysis(args.dataset)


if __name__ == "__main__":
    main()
