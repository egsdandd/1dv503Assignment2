export default {
  testEnvironment: 'node',
  transform: {},
  injectGlobals: true,
  testMatch: ['**/__tests__/**/*.test.js', '**/?(*.)+(spec|test).js'],
  collectCoverageFrom: [
    'controllers/**/*.js',
    'models/**/*.js',
    'routes/**/*.js',
    '!**/__tests__/**'
  ]
}
