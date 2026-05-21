import { Options } from 'tsup'
import { readFileSync, writeFileSync } from 'fs'
import path from 'path'
import { globSync } from 'glob'

export interface TsupExportsConfig {
  outDir?: string
  srcDir?: string
  entryPattern?: string
  tsupOptions?: Partial<Options>
  customExports?: Record<string, any>
}

export function createTsupConfig(config: TsupExportsConfig = {}) {
  const { outDir = 'dist', srcDir = 'src', entryPattern = '**/index.ts', tsupOptions = {}, customExports } = config

  const entryGlob = `${srcDir}/${entryPattern}`
  const entries = [entryGlob]

  const tsupConfig: Options = {
    entry: entries,
    format: ['cjs', 'esm'],
    dts: true,
    silent: false,
    outDir,
    onSuccess: async () => {
      const pkgPath = path.resolve(process.cwd(), 'package.json')
      const pkgContent = readFileSync(pkgPath, 'utf8')

      const pkg = JSON.parse(pkgContent)

      pkg.exports = {}

      if (customExports === null) {
        delete pkg.exports
      } else if (customExports) {
        pkg.exports = customExports
      } else {
        const entryFiles = globSync(entryGlob)
        if (entryFiles.length === 0) {
          console.warn(`Warning: No files found matching pattern ${entryGlob}`)
        }

        for (const entryFile of entryFiles) {
          const dir = path.dirname(entryFile)
          const isRootEntry = dir === srcDir

          if (isRootEntry) {
            pkg.main = `./${outDir}/index.js`
            pkg.module = `./${outDir}/index.mjs`
            pkg.types = `./${outDir}/index.d.ts`
          }
        }

        for (const entryFile of entryFiles) {
          const dir = path.dirname(entryFile)
          const isRootEntry = dir === srcDir
          const exportKey = isRootEntry ? '.' : `./${dir.substring(srcDir.length + 1)}`

          const outputPath = isRootEntry ? '' : `${dir.substring(srcDir.length + 1)}/`

          pkg.exports[exportKey] = {
            import: {
              types: `./${outDir}/${outputPath}index.d.mts`,
              default: `./${outDir}/${outputPath}index.mjs`
            },
            require: {
              types: `./${outDir}/${outputPath}index.d.ts`,
              default: `./${outDir}/${outputPath}index.js`
            }
          }
        }
      }

      const orderedPkg = {}

      let exportsInserted = false

      const { main, module, types, exports, ...rest } = pkg
      for (const key of Object.keys(rest)) {
        if ((key === 'files' || key === 'scripts') && !exportsInserted) {
          orderedPkg['main'] = main
          orderedPkg['module'] = module
          orderedPkg['types'] = types
          orderedPkg['exports'] = exports
          exportsInserted = true
        }

        orderedPkg[key] = pkg[key]
      }

      if (!exportsInserted) {
        orderedPkg['main'] = main
        orderedPkg['module'] = module
        orderedPkg['types'] = types
        orderedPkg['exports'] = exports
      }

      writeFileSync(pkgPath, JSON.stringify(orderedPkg, null, 2) + '\n')
    },
    ...tsupOptions
  }
  return tsupConfig
}
