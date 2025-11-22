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
      let parsed

      try {
        parsed = this.parseImportLine(line)
      } catch {
        processedImports.push({ line, path: '' })
        continue
      }

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

    let i = 0
    while (i < lines.length) {
      const line = lines[i]

      if (this.isImportStart(line)) {
        if (blockStart === -1) {
          blockStart = i
        }

        if (this.isSingleLineImport(line)) {
          blockEnd = i
          imports.push({ line, startIndex: i, endIndex: i })
          i++
        } else {
          const result = this.collectMultilineImport(lines, i)
          blockEnd = result.endIndex
          imports.push({
            line: result.fullImport,
            startIndex: i,
            endIndex: result.endIndex,
          })
          i = result.endIndex + 1
        }
      } else if (blockStart !== -1 && line.trim() !== '') {
        break
      } else {
        i++
      }
    }

    return { imports, blockStart, blockEnd }
  }

  private isImportStart(line: string): boolean {
    return /^\s*import\s+/.test(line)
  }

  private isSingleLineImport(line: string): boolean {
    return /^(\s*import\s+.+\s+from\s+['"])(.+)(['"].*)$/.test(line)
  }

  private collectMultilineImport(
    lines: string[],
    startIndex: number,
  ): { fullImport: string; endIndex: number } {
    let fullImport = lines[startIndex]
    let i = startIndex + 1

    while (i < lines.length) {
      fullImport += '\n' + lines[i]

      if (/\s+from\s+['"]/.test(lines[i])) {
        return { fullImport, endIndex: i }
      }
      i++
    }

    return { fullImport, endIndex: i - 1 }
  }

  private parseImportLine(line: string): {
    prefix: string
    importPath: string
    suffix: string
  } {
    const regex = /^(\s*import\s+[\s\S]+\s+from\s+['"])(.+)(['"].*)$/m
    const match = regex.exec(line)

    if (!match) {
      throw new Error('Invalid import')
    }

    const [, prefix, importPath, suffix] = match
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
