import { ImportRewriter } from '../src/ImportRewriter'
import type { AliasConfiguration } from '../src/TsconfigReader'
import * as path from 'node:path'

describe('ImportRewriter', () => {
  const aliasConfigurations: AliasConfiguration[] = [
    { path: path.resolve(__dirname, '../src'), prefix: '@' },
    { path: path.resolve(__dirname, '../tests'), prefix: '@Tests' },
  ]

  const importRewriter = new ImportRewriter(aliasConfigurations)

  it('should convert relative import to alias import', () => {
    const filePath = path.resolve(__dirname, '../src/foo/bar.ts')
    const fileContent = `import { something } from '../utils/helper.js'\n`

    const { modified, content } = importRewriter.rewriteImportsInFile(
      filePath,
      fileContent,
    )

    expect(modified).toBe(true)
    expect(content).toContain(`import { something } from '@/utils/helper.js'`)
  })

  it('should not modify non-relative imports', () => {
    const filePath = path.resolve(__dirname, '../src/foo/bar.ts')
    const fileContent = `import { something } from 'external-package'\n`

    const { modified, content } = importRewriter.rewriteImportsInFile(
      filePath,
      fileContent,
    )

    expect(modified).toBe(false)
    expect(content).toBe(fileContent)
  })

  it('should handle multiple imports', () => {
    const filePath = path.resolve(__dirname, '../src/foo/bar.ts')
    const fileContent = `import { a } from '../utils/a.js'\nimport { b } from '../utils/b.js'\n`

    const { modified, content } = importRewriter.rewriteImportsInFile(
      filePath,
      fileContent,
    )

    expect(modified).toBe(true)
    expect(content).toContain(`import { a } from '@/utils/a.js'`)
    expect(content).toContain(`import { b } from '@/utils/b.js'`)
  })

  it('should handle files with no imports', () => {
    const filePath = path.resolve(__dirname, '../src/foo/bar.ts')
    const fileContent = `const x = 42\n`

    const { modified, content } = importRewriter.rewriteImportsInFile(
      filePath,
      fileContent,
    )

    expect(modified).toBe(false)
    expect(content).toBe(fileContent)
  })

  it('should preserve code after import block', () => {
    const filePath = path.resolve(__dirname, '../src/foo/bar.ts')
    const fileContent = `import { something } from '../utils/helper.js'\n\nconst x = 42\n`

    const { modified, content } = importRewriter.rewriteImportsInFile(
      filePath,
      fileContent,
    )

    expect(modified).toBe(true)
    expect(content).toContain(`const x = 42`)
  })

  it('should not convert relative imports outside alias paths', () => {
    const filePath = path.resolve(__dirname, '../src/foo/bar.ts')
    const fileContent = `import { external } from '../../outside/helper.js'\n`

    const { modified, content } = importRewriter.rewriteImportsInFile(
      filePath,
      fileContent,
    )

    expect(modified).toBe(false)
    expect(content).toBe(fileContent)
  })

  it('should handle empty file content', () => {
    const filePath = path.resolve(__dirname, '../src/foo/bar.ts')
    const fileContent = ``

    const { modified, content } = importRewriter.rewriteImportsInFile(
      filePath,
      fileContent,
    )

    expect(modified).toBe(false)
    expect(content).toBe(fileContent)
  })
})
