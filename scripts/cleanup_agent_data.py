from src.agent.proposals import ProposalStore


def main() -> None:
    store = ProposalStore()
    store.ensure_schema()
    cleared = store.clear_terminal_arguments()
    deleted = store.cleanup_retention()
    print(
        {
            "arguments_cleared": cleared,
            **deleted,
        }
    )


if __name__ == "__main__":
    main()
