interface ITestRunner {
  run(testsRoot: string, clb: (error: Error, failures?: number) => void): void;
}
