module.exports = {
  default: {
    parallel: 2,
    paths: ['test/features/**/*.feature'],
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    require: ['test/support/**/*.ts', 'test/step-definitions/**/*.ts'],
    format: ['progress-bar', '@cucumber/pretty-formatter'],
    snippets: 'cucumber-expression',
    failFast: true,
    timeout: 30000
  }
}
