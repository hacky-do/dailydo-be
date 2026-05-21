import { config } from '@system/eslint/nest.js'

export default [
  {
    ignores: ['dist/**', 'node_modules/**']
  },
  ...config,
  {
    files: ['src/**/*.ts']
  }
]
