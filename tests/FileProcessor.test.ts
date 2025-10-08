import { FileProcessor } from '../src/FileProcessor'
import { ImportRewriter } from '../src/ImportRewriter'
import type { AliasConfiguration } from '../src/TsconfigReader'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('FileProcessor', () => {
  const tempDir = path.join(__dirname, '__temp_fileprocessor__')
  const srcDir = path.join(tempDir, 'src')
  const testFilePath = path.join(srcDir, 'test.ts')

  const aliasConfigs: AliasConfiguration[] = [
    {
      prefix: '@',
      path: srcDir,
    },
  ]

  beforeEach(() => {
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true })
    }
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe('dryRun = false', () => {
    it('should modify file when imports can be converted', () => {
      const originalContent = `import { helper } from './utils.js'\n`
      fs.writeFileSync(testFilePath, originalContent, 'utf8')

      const dryRun = false
      const rewriter = new ImportRewriter(aliasConfigs)
      const processor = new FileProcessor(rewriter, dryRun)

      const wasModified = processor.processFile(testFilePath)

      expect(wasModified).toBe(true)
      const fileContent = fs.readFileSync(testFilePath, 'utf8')
      expect(fileContent).toBe(`import { helper } from '@/utils.js'\n`)
    })

    it('should not modify file when no imports need conversion', () => {
      const originalContent = `import { something } from 'external'\n`
      fs.writeFileSync(testFilePath, originalContent, 'utf8')

      const dryRun = false
      const rewriter = new ImportRewriter(aliasConfigs)
      const processor = new FileProcessor(rewriter, dryRun)

      const wasModified = processor.processFile(testFilePath)

      expect(wasModified).toBe(false)
      const fileContent = fs.readFileSync(testFilePath, 'utf8')
      expect(fileContent).toBe(originalContent)
    })
  })

  describe('dryRun = true', () => {
    it('should detect files that need modification', () => {
      const originalContent = `import { helper } from './utils.js'\n`
      fs.writeFileSync(testFilePath, originalContent, 'utf8')

      const dryRun = true
      const rewriter = new ImportRewriter(aliasConfigs)
      const processor = new FileProcessor(rewriter, dryRun)

      const fileNeedsModification = processor.processFile(testFilePath)

      expect(fileNeedsModification).toBe(true)
    })

    it('should not modify file when imports can be converted', () => {
      const originalContent = `import { helper } from './utils.js'\n`
      fs.writeFileSync(testFilePath, originalContent, 'utf8')

      const dryRun = true
      const rewriter = new ImportRewriter(aliasConfigs)
      const processor = new FileProcessor(rewriter, dryRun)

      const fileNeedsModification = processor.processFile(testFilePath)

      const fileContent = fs.readFileSync(testFilePath, 'utf8')
      expect(fileNeedsModification).toBe(true)
      expect(fileContent).toBe(originalContent)
    })

    it('should return false when no imports need conversion', () => {
      const originalContent = `import { something } from 'external'\n`
      fs.writeFileSync(testFilePath, originalContent, 'utf8')

      const rewriter = new ImportRewriter(aliasConfigs)
      const processor = new FileProcessor(rewriter, true)

      const fileNeedsModification = processor.processFile(testFilePath)

      expect(fileNeedsModification).toBe(false)
    })
  })

  it('should handle multiple imports in one file', () => {
    const originalContent = `import { helper } from './utils.js'\nimport { foo } from './bar.js'\n`
    fs.writeFileSync(testFilePath, originalContent, 'utf8')

    const rewriter = new ImportRewriter(aliasConfigs)
    const processor = new FileProcessor(rewriter, false)

    const wasModified = processor.processFile(testFilePath)

    expect(wasModified).toBe(true)
    const fileContent = fs.readFileSync(testFilePath, 'utf8')
    expect(fileContent).toBe(
      `import { helper } from '@/utils.js'\nimport { foo } from '@/bar.js'\n`,
    )
  })
})
