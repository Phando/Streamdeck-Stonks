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
rm deploy.sh

echo "Committing"
git add .
git commit -m "Prepping for main"

echo "Pushing to master"
push=$(git push origin stageSpace:master --force)
echo $push
git status

echo "Cleaning up"
git switch development
git checkout .
git branch -D stageSpace

echo "Done"
exit 0