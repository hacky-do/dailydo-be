import globals from 'globals'

import { config as baseConfig } from './base.js'

export const config = [
  {
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  {
    plugins: {},
    rules: {}
  },
  ...baseConfig,
  {
    rules: {
      '@next/next/no-img-element': 0
    }
  }
]
