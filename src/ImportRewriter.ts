import * as path from 'node:path'
import type { AliasConfiguration } from './TsconfigReader.js'

interface ImportStatement {
  line: string
  path: string
}

export class ImportRewriter {
  constructor(private readonly aliasConfigurations: AliasConfiguration[]) {}

  rewriteImportsInFile(
    filePath: string,
    fileContent: string,
  ): { modified: boolean; content: string } {
    const lines = fileContent.split('\n')

    const { imports, blockStart, blockEnd } = this.extractImportBlock(lines)

    if (imports.length === 0) {
      return { modified: false, content: fileContent }
    }

    let anyModified = false
    const processedImports: ImportStatement[] = []

    for (const { line } of imports) {
      const parsed = this.parseImportLine(line)

      const { prefix, importPath, suffix } = parsed
      const { path: finalPath, wasConverted } = this.convertRelativeToAlias(
        importPath,
        filePath,
      )

      if (wasConverted) {
        anyModified = true
      }

      processedImports.push({
        line: `${prefix}${finalPath}${suffix}`,
        path: finalPath,
      })
    }

    if (!anyModified) {
      return { modified: false, content: fileContent }
    }

    const newLines = this.reconstructFile(
      lines,
      processedImports,
      blockStart,
      blockEnd,
    )
    return { modified: true, content: newLines.join('\n') }
  }

  private extractImportBlock(lines: string[]): {
    imports: { line: string; startIndex: number; endIndex: number }[]
    blockStart: number
    blockEnd: number
  } {
    let blockStart = -1
    let blockEnd = -1

    const imports: { line: string; startIndex: number; endIndex: number }[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const isImportLine = /^(\s*import\s+.+\s+from\s+['"])(.+)(['"].*)$/.test(
        line,
      )

      if (isImportLine) {
        if (blockStart === -1) {
          blockStart = i
        }
        blockEnd = i
        imports.push({ line, startIndex: i, endIndex: i })
      } else if (blockStart !== -1 && line.trim() !== '') {
        break
      }
    }

    return { imports, blockStart, blockEnd }
  }

  private parseImportLine(line: string): {
    prefix: string
    importPath: string
    suffix: string
  } {
    const regex = /^(\s*import\s+.+\s+from\s+['"])(.+)(['"].*)$/

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const [, prefix, importPath, suffix] = regex.exec(line)!
    return { prefix, importPath, suffix }
  }

  private convertRelativeToAlias(
    importPath: string,
    filePath: string,
  ): { path: string; wasConverted: boolean } {
    const isRelativeImport =
      importPath.startsWith('./') || importPath.startsWith('../')

    if (!isRelativeImport) {
      return { path: importPath, wasConverted: false }
    }

    const sourceDir = path.dirname(filePath)
    const absoluteImportPath = path.resolve(sourceDir, importPath)

    for (const { path: aliasPath, prefix: aliasPrefix } of this
      .aliasConfigurations) {
      const absoluteAliasPath = path.resolve(aliasPath)
      const isWithinAliasPath = absoluteImportPath.startsWith(absoluteAliasPath)

      if (isWithinAliasPath) {
        const relativePath = path.relative(
          absoluteAliasPath,
          absoluteImportPath,
        )
        const aliasImportPath = `${aliasPrefix}/${relativePath}`.replace(
          /\\/g,
          '/',
        )
        return { path: aliasImportPath, wasConverted: true }
      }
    }

    return { path: importPath, wasConverted: false }
  }

  private reconstructFile(
    lines: string[],
    sortedImports: ImportStatement[],
    blockStart: number,
    blockEnd: number,
  ): string[] {
    const before = lines.slice(0, blockStart)
    const after = lines.slice(blockEnd + 1)

    return [...before, ...sortedImports.map((imp) => imp.line), ...after]
  }
}
