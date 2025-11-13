module.exports = {
  // Use jsdom for client-side testing (if any, typically for frontend) or node
  // For this backend project, 'node' is fine, or leave it as default.
  // env is typically handled by the test setup/teardown
  testEnvironment: 'node', 
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // An array of glob patterns that match files for which coverage information should be collected
  collectCoverageFrom: [
    '**/routes/*.js',
    '**/models/*.js',
    '**/middleware/*.js',
    '!**/node_modules/**'
  ],
  // The directory where Jest should output its coverage files
  coverageDirectory: 'coverage',
  // A list of paths to modules that run before jest is initialized
  setupFilesAfterEnv: ['<rootDir>/tests/jest.setup.js'],
  // The glob patterns Jest uses to detect test files
  testMatch: [
    '**/tests/?(*.)+(spec|test).js'
  ],
  // Exclude node_modules from transpilation
  transformIgnorePatterns: ['/node_modules/'],
  // Custom module mapper to handle aliases or non-JS files (not strictly needed here but good practice)
};