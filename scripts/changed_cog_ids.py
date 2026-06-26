#!/usr/bin/env python3
"""
Print the ids of cogs in data/cogs.json that are new or changed relative to
a base commit. Used by the PR validation workflow to scope the release check
to only the cog(s) a PR actually touches.
"""

import json
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).parent.parent
COGS_FILE = REPO_ROOT / "data" / "cogs.json"


def load_entries(data: dict) -> dict:
    entries = {}
    for status in ("approved", "unapproved"):
        for entry in data.get(status, []):
            entries[entry["id"]] = entry
    return entries


def load_at_ref(ref: str) -> dict:
    result = subprocess.run(
        ["git", "show", f"{ref}:data/cogs.json"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return {}
    return load_entries(json.loads(result.stdout))


def main() -> None:
    base_ref = sys.argv[1]

    base_entries = load_at_ref(base_ref)
    with open(COGS_FILE) as f:
        head_entries = load_entries(json.load(f))

    changed = [
        cog_id
        for cog_id, entry in head_entries.items()
        if base_entries.get(cog_id) != entry
    ]

    print("\n".join(changed))


if __name__ == "__main__":
    main()
