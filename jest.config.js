module.exports = {
  // roots: ['<rootDir>/out'],
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/out/test/**/*.jest.test.js'], // for some reason I don't get, there are tests compile in out/test and out/src/test
};
