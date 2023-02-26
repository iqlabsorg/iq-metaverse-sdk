/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  runner: 'groups',
  testEnvironment: 'node',
  testTimeout: 100000,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  transformIgnorePatterns: [`/node_modules/(?!@iqprotocol/iq-space-protocol/deploy)`],
  coveragePathIgnorePatterns: ['<rootDir>/src/contracts'],
};
