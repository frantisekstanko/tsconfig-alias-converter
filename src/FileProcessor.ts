import * as fs from 'node:fs'
import type { ImportRewriter } from './ImportRewriter.js'

export class FileProcessor {
  constructor(private readonly importRewriter: ImportRewriter) {}

  processFile(filePath: string): boolean {
    const fileContent = fs.readFileSync(filePath, 'utf8')

    const { modified, content } = this.importRewriter.rewriteImportsInFile(
      filePath,
      fileContent,
    )

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8')
    }

    return modified
  }
}
