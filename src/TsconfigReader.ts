import * as fs from 'node:fs'
import * as path from 'node:path'

export interface AliasConfiguration {
  path: string
  prefix: string
}

export class TsconfigReader {
  static readAliasConfigurations(tsconfigPath: string): AliasConfiguration[] {
    const absoluteTsconfigPath = path.resolve(tsconfigPath)

    const tsconfigContent = fs.readFileSync(absoluteTsconfigPath, 'utf8')

    const tsconfig = JSON.parse(tsconfigContent) as {
      compilerOptions?: { baseUrl?: string; paths?: Record<string, string[]> }
    }

    const baseUrl = tsconfig.compilerOptions?.baseUrl ?? './'

    const paths = tsconfig.compilerOptions?.paths ?? {}

    const tsconfigDir = path.dirname(absoluteTsconfigPath)
    const absoluteBaseUrl = path.resolve(tsconfigDir, baseUrl)

    const aliasConfigurations: AliasConfiguration[] = []

    for (const [aliasPattern, targetPaths] of Object.entries(paths)) {
      if (targetPaths.length === 0) {
        continue
      }

      const prefix = aliasPattern.replace(/\/\*$/, '')
      const targetPath = targetPaths[0].replace(/\/\*$/, '')
      const absolutePath = path.resolve(absoluteBaseUrl, targetPath)

      aliasConfigurations.push({
        path: absolutePath,
        prefix,
      })
    }

    return aliasConfigurations
  }
}
