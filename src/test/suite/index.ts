// https://medium.com/@soloydenko/end-to-end-testing-vs-code-extensions-via-jest-828e5edfeb75
// FIXME: nb this is not really working, but jest jests are working kind of.
// Turning off the mocha tests for now because they conflict
// Mocha tests kind of suck anyway e2e because they cannot be run while vscode is open
// index 43424a1..2eaa151 100644
// --- a/package.json
// +++ b/package.json
// @@ -91,7 +91,6 @@
//      "@types/glob": "^7.1.1",
//      "@types/jest": "^25.2.3",
//      "@types/jest-cli": "^24.3.0",
// -    "@types/mocha": "^5.2.6",
//      "@types/node": "^10.12.18",
//      "@types/vscode": "^1.32.0",
//      "@typescript-eslint/eslint-plugin": "^2.28.0",
// @@ -101,7 +100,6 @@
//      "glob": "^7.1.4",
//      "jest": "^26.0.1",
//      "jest-cli": "^26.0.1",
// -    "mocha": "^6.1.4",
//      "remark": "^12.0.0",
//      "remark-wiki-link": "^0.0.4",
//      "source-map-support": "^0.5.12",
// mocha version (works when you don't also import jest)

// import * as glob from 'glob';

// export function run(): Promise<void> {
//   // Create the mocha test
//   const mocha = new Mocha({
//     ui: 'tdd',
//   });
//   mocha.useColors(true);

//   const testsRoot = path.resolve(__dirname, '..');

//   return new Promise((c, e) => {
//     glob('**/**.test.js', { cwd: testsRoot }, (err, files) => {
//       if (err) {
//         return e(err);
//       }

//       // Add files to the test suite
//       files.forEach((f) => mocha.addFile(path.resolve(testsRoot, f)));

//       try {
//         // Run the mocha test
//         mocha.run((failures) => {
//           if (failures > 0) {
//             e(new Error(`${failures} tests failed.`));
//           } else {
//             c();
//           }
//         });
//       } catch (err) {
//         console.error(err);
//         e(err);
//       }
//     });
//   });
// }

// jest version below
// import { runCli } from 'jest-cli'; // this was failing
import { run } from 'jest-cli';
const path = require('path');

const jestTestRunnerForVSCodeE2E: ITestRunner = {
  run(testsRoot: string, reportTestResults: (error: Error, failures?: number) => void): void {
    const projectRootPath = path.join(process.cwd(), '../..');
    const config = path.join(projectRootPath, 'jest.e2e.config.js');
    run({ config } as any, projectRootPath).then((jestCliCallResult) => {
      // try to figure out what this looks like. seems to be void?
      console.error(jestCliCallResult);
    });

    // This version from the blog post was not working:
    // because import runCli failed
    // https://medium.com/@soloydenko/end-to-end-testing-vs-code-extensions-via-jest-828e5edfeb75
    // runCli({ config } as any, [projectRootPath]).then((jestCliCallResult) => {
    //   jestCliCallResult.results.testResults.forEach((testResult) => {
    //     testResult.testResults
    //       .filter((assertionResult) => assertionResult.status === 'passed')
    //       .forEach(({ ancestorTitles, title, status }) => {
    //         console.info(`  ● ${ancestorTitles} › ${title} (${status})`);
    //       });
    //   });

    //   jestCliCallResult.results.testResults.forEach((testResult) => {
    //     if (testResult.failureMessage) {
    //       console.error(testResult.failureMessage);
    //     }
    //   });

    //   reportTestResults(undefined, jestCliCallResult.results.numFailedTests);
    // });
  },
};
module.exports = jestTestRunnerForVSCodeE2E;
