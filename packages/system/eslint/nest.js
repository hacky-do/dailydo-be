import { config as nodeConfig } from './node.js'

export const config = [
  ...nodeConfig,
  {
    rules: {
      '@next/next/no-img-element': 0
    }
  }
]
