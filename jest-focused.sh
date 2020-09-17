#!/bin/bash
# Usage:
# Run test at line 248 of extension.test.js:
#   ./jest-run-focused-test.sh out/test/jest/extension.test.js:248
# Run all tests in extension.test.js:
#   ./jest-run-focused-test.sh out/test/jest/extension.test.js
#
set -e
# location of script that will parse out the test function given a filepath and line
wd=`pwd`
test_at_line_js="$wd/out/test-at-line.js"

# arg $1 is the test filename
# replace "/./"" with "/" (artifact of vscode-run-in-terminal starting relative path with a "./")
filename=`echo "$1" | sed 's/\.\/src/.\/out/'`
# replace 'ts' with 'js' in filename
filename=`echo "$filename" | sed 's/\.ts$/.js/'`
filename=`echo "$filename" | sed 's/\.ts:/.js:/'`
# strip the linenumber off the location
filename=`echo "$filename" | sed 's/:.*//'`

config_file="jest.config.js"

npm run compile

# if given file + line number, parse out the test name to run and pass in as a focused test run
if echo "$1" | grep -q ":[0-9]\+$" ; then
    bdd_description=$(node $test_at_line_js $1)
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
shift;

# Removed --max_old_space_size=4096
if [[ $* == *--debug* ]]
then
    set -x
    node --inspect --inspect-brk ./node_modules/.bin/jest --config "$config_file" --runInBand "$filename" -t "$bdd_description" "$@"
else
    set -x
    node ./node_modules/.bin/jest --config "$config_file" "$filename" -t "$bdd_description" "$@"
fi