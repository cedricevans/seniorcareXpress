#!/bin/sh
# Helper: remove committed pb_data from git index (safe, non-destructive to working tree)
# Run this from the repo root. It will stop tracking apps/pocketbase/pb_data and
# create a commit removing it from the repository history going forward.

set -e

PB_PATH="apps/pocketbase/pb_data"

if [ ! -d "$PB_PATH" ]; then
  echo "No $PB_PATH directory found in working tree. Nothing to do."
  exit 0
fi

echo "About to remove $PB_PATH from git index (it will remain in your working tree)."
echo "This will stage the removal for commit. Continue? (y/N)"
read ans
if [ "$ans" != "y" ] && [ "$ans" != "Y" ]; then
  echo "Aborted."
  exit 1
fi

# Remove from index but keep files in working tree
git rm -r --cached "$PB_PATH"

echo "Removed $PB_PATH from git index. Commit the change with a message like:

  git commit -m "chore: stop tracking PocketBase runtime DB (pb_data)"

Then push to remote. If pb_data was already included in past commits and you
want to scrub it from history, consider using the BFG Repo-Cleaner or git
filter-repo — but be careful: that rewrites history and affects all collaborators."
