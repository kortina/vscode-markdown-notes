#!/bin/bash
# Usage:
# Run test at line 248 of extension.test.js:
#   ./jest-run-focused-test.sh out/test/jest/extension.test.js:248
# Run all tests in extension.test.js:
#   ./jest-run-focused-test.sh out/test/jest/extension.test.js
#
set -e
# location of script that will parse out the test function given a filepath and line
test_at_line_js="out/test-at-line.js"

# arg $1 is the test filename
# replace "/./"" with "/" (artifact of vscode-run-in-terminal starting relative path with a "./")
testloc=`echo "$1" | sed 's/\.\/src/.\/out/'`
# replace 'ts' with 'js' in filename
testloc=`echo "$testloc" | sed 's/\.ts$/.js/'`
testloc=`echo "$testloc" | sed 's/\.ts:/.js:/'`
# strip the linenumber off the location
filename=`echo "$testloc" | sed 's/:.*//'`

config_file="jest.config.js"
# if given file + line number, parse out the test name to run and pass in as a focused test run
if echo "$testloc" | grep -q ":[0-9]\+$" ; then
    cmd="node $(pwd)/ $testloc"
    bdd_description=$(node $(pwd)/$test_at_line_js $testloc)
    bdd_size=${#bdd_description}
    if [ $bdd_size -eq 0 ]; then
        echo "Not in a describe block, nothing to run!"
        exit 1
    fi
else
    echo "No line number, running entire file."
fi

echo ""
echo "$bdd_description"
echo ""
# set -x
shift;

# Removed --max_old_space_size=4096
if [[ $* == *--debug* ]]
then
    node --inspect --inspect-brk ./node_modules/.bin/jest --config "$config_file" --runInBand "$filename" -t "$bdd_description" "$@"
else
    node ./node_modules/.bin/jest --config "$config_file" "$filename" -t "$bdd_description" "$@"
fi