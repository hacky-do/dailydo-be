import { config } from '@system/eslint/node.js'

export default [
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  ...config,
  {
    files: ['src/**/*.ts']
  }
]
