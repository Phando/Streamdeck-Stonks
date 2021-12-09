#!/bin/sh
branch_name=$(git symbolic-ref -q HEAD)

if [[ "$branch_name" != *"development"* ]]; then
    echo "post-commit only needs to be run on the 'development' branch."
    exit 0
fi

echo "Prepping - Stage Branch"
git checkout -b stageSpace

rm -rf Sources/
rm DistributionTool
rm build.sh
rm prep.sh

echo "Cleaning up"
git add .
git commit -m "Prepping for main"
git push origin stageSpace:master
git switch development
git checkout .
git branch -D stageSpace

echo ""
echo "post-commit complete."
exit 0