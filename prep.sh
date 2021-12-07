#!/bin/sh
branch_name=$(git symbolic-ref -q HEAD)

if [[ "$branch_name" != *"development"* ]]; then
    echo "post-commit only needs to be run on the 'development' branch."
    exit 0
fi

echo "Prepping - Stage Branch"
git switch stage
git fetch
git reset --hard HEAD
git merge origin/development

rm -rf Sources/
rm DistributionTool
rm build.sh
rm prep.sh

echo "Cleaning up"
git commit -m "Prepping for main"
# git push
git switch development

echo ""
echo "post-commit complete."
exit 0