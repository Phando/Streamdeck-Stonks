#!/bin/bash
branch_name=${branch_name:-HEAD}

if [ "$branch_name" != "stage" ]; then
    echo "Please switch to the 'stage' branch."
    exit 0
fi

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd $SCRIPT_DIR
echo $SCRIPT_DIR

rm -rf Sources/
rm DistributionTool
rm build.sh
rm prep.sh

echo ""
echo "Done"
exit 0

