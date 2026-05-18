#!/usr/bin/env python3
"""
Resolve cog metadata by cloning each listed repository and reading its pyproject.toml.
Writes resolved metadata to data/resolved.json.
"""

import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

try:
    import tomllib
except ModuleNotFoundError:
    # Python < 3.11
    try:
        import tomli as tomllib  # type: ignore
    except ModuleNotFoundError:
        print("ERROR: tomli is required on Python < 3.11. Install it with: pip install tomli", file=sys.stderr)
        sys.exit(1)

REPO_ROOT = Path(__file__).parent.parent
COGS_FILE = REPO_ROOT / "data" / "cogs.json"
RESOLVED_FILE = REPO_ROOT / "public" / "data" / "resolved.json"


def get_release_ref(repo_url: str, version: str) -> str | None:
    """Return the tag name if a release tag exists for the given version, else None."""
    if not version:
        return None
    for tag in (f"v{version}", version):
        result = subprocess.run(
            ["git", "ls-remote", "--tags", repo_url, tag],
            capture_output=True,
            text=True,
        )
        if result.returncode == 0 and result.stdout.strip():
            return tag
    return None


def clone_and_read(repo_url: str, branch: str, tmpdir: str) -> dict | None:
    dest = os.path.join(tmpdir, "repo")
    result = subprocess.run(
        ["git", "clone", "--depth", "1", "--branch", branch, repo_url, dest],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(f"  WARNING: Failed to clone {repo_url}@{branch}: {result.stderr.strip()}", file=sys.stderr)
        return None

    pyproject_path = Path(dest) / "pyproject.toml"
    if not pyproject_path.exists():
        print(f"  WARNING: No pyproject.toml found in {repo_url}", file=sys.stderr)
        return None

    with open(pyproject_path, "rb") as f:
        data = tomllib.load(f)

    project = data.get("project", {})
    return {
        "name": project.get("name", ""),
        "version": project.get("version", ""),
        "description": project.get("description", ""),
        "license": project.get("license", ""),
        "authors": project.get("authors", []),
        "urls": project.get("urls", {}),
        "dependencies": project.get("dependencies", []),
    }


def main() -> None:
    with open(COGS_FILE) as f:
        cogs_data = json.load(f)

    resolved = []

    for status in ("approved", "unapproved"):
        for entry in cogs_data.get(status, []):
            repo_url = entry["repo"]
            branch = entry.get("branch", "main")
            cog_id = entry["id"]
            print(f"Processing [{status}] {cog_id} ({repo_url}@{branch}) ...")

            with tempfile.TemporaryDirectory() as tmpdir:
                metadata = clone_and_read(repo_url, branch, tmpdir)

            if metadata is None:
                metadata = {}

            version = metadata.get("version", "")
            release_ref = get_release_ref(repo_url, version) if version else None
            if release_ref:
                install_url = f"git+{repo_url}@{release_ref}"
            else:
                install_url = f"git+{repo_url}.git#{branch}"

            resolved.append({
                "id": cog_id,
                "status": status,
                "repo": repo_url,
                "branch": branch,
                "install_url": install_url,
                **metadata,
            })

    with open(RESOLVED_FILE, "w") as f:
        json.dump(resolved, f, indent=2)

    print(f"\nResolved {len(resolved)} cog(s) -> {RESOLVED_FILE}")


if __name__ == "__main__":
    main()
