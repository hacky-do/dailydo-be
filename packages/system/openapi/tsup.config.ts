import {defineConfig} from 'tsup'
import {createTsupConfig} from '@system/tsup'

export default defineConfig(
  createTsupConfig({
    tsupOptions: {publicDir: 'public'}
  })
)
