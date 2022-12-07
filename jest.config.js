/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  runner: 'groups',
  testEnvironment: 'node',
  testTimeout: 10000,
  transform: {
    '^.+\\.ts?$': 'ts-jest',
  },
  collectCoverageFrom: ['<rootDir>/src/**/*.ts'],
  testMatch: ['<rootDir>/test/**/*.test.ts'],
  // transformIgnorePatterns: [
  //   `/node_modules/(?!@iqprotocol/solidity-contracts-nft/deploy)`,
  //   `/node_modules/(?!@iqprotocol/solidity-contracts-nft/tasks)`,
  // ],
};
