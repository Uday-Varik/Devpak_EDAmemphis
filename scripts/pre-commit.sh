#!/usr/bin/env sh
# DevPack pre-commit check: runs the Vitest suite and fails the commit if it fails.
#
# Not enabled by default. To enable it locally, run once from the repo root:
#   git config core.hooksPath scripts/hooks
# with scripts/hooks/pre-commit containing:  exec sh scripts/pre-commit.sh
# (or: ln -s ../../scripts/pre-commit.sh .git/hooks/pre-commit)

set -e
cd "$(dirname "$0")/.."

npx vitest run
