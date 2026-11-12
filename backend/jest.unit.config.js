module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/engine/*.test.ts'],
  clearMocks: true,
  restoreMocks: true,
};
