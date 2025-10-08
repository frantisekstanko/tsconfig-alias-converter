import * as path from 'node:path'
import { TsconfigReader } from './TsconfigReader.js'
import { ImportRewriter } from './ImportRewriter.js'
import { FileProcessor } from './FileProcessor.js'

export class TsconfigAliasConverter {
  static processFiles(
    filePaths: string[],
    tsconfigPath = './tsconfig.json',
    dryRun: boolean,
  ): { modifiedCount: number; totalCount: number } {
    const aliasConfigurations =
      TsconfigReader.readAliasConfigurations(tsconfigPath)

    const importRewriter = new ImportRewriter(aliasConfigurations)

    const fileProcessor = new FileProcessor(importRewriter, dryRun)

    let modifiedCount = 0

    for (const file of filePaths) {
      const absolutePath = path.isAbsolute(file) ? file : path.resolve(file)
      if (fileProcessor.processFile(absolutePath)) {
        modifiedCount++
      }
    }

    return {
      modifiedCount,
      totalCount: filePaths.length,
    }
  }
}
