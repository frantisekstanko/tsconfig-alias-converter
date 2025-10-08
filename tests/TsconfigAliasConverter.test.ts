import { TsconfigAliasConverter } from '../src/TsconfigAliasConverter'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('TsconfigAliasConverter', () => {
  const tempDir = path.join(__dirname, '__temp_converter__')
  const srcDir = path.join(tempDir, 'src')
  const tsconfigPath = path.join(tempDir, 'tsconfig.json')
  const testFilePath = path.join(srcDir, 'test.ts')

  beforeEach(() => {
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true })
    }

    const tsconfigContent = {
      compilerOptions: {
        baseUrl: './',
        paths: {
          '@/*': ['src/*'],
        },
      },
    }

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent), 'utf8')
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should process multiple files', () => {
    const file1Path = path.join(srcDir, 'file1.ts')
    const file2Path = path.join(srcDir, 'file2.ts')

    fs.writeFileSync(file1Path, `import { helper } from './utils.js'\n`, 'utf8')
    fs.writeFileSync(
      file2Path,
      `import { something } from 'external'\n`,
      'utf8',
    )

    const result = TsconfigAliasConverter.processFiles(
      [file1Path, file2Path],
      tsconfigPath,
    )

    expect(result.totalCount).toBe(2)
    expect(result.modifiedCount).toBe(1)

    const file1Content = fs.readFileSync(file1Path, 'utf8')
    expect(file1Content).toContain(`import { helper } from '@/utils.js'`)
  })

  it('should use default tsconfig path when not specified', () => {
    const originalCwd = process.cwd()
    process.chdir(tempDir)

    try {
      fs.writeFileSync(
        testFilePath,
        `import { helper } from './utils.js'\n`,
        'utf8',
      )

      const result = TsconfigAliasConverter.processFiles([testFilePath])

      expect(result.totalCount).toBe(1)
      expect(result.modifiedCount).toBe(1)
    } finally {
      process.chdir(originalCwd)
    }
  })

  it('should handle relative file paths', () => {
    const relativePath = 'src/relative.ts'
    const absolutePath = path.resolve(tempDir, relativePath)

    const originalCwd = process.cwd()
    process.chdir(tempDir)

    try {
      fs.writeFileSync(
        absolutePath,
        `import { helper } from './utils.js'\n`,
        'utf8',
      )

      const result = TsconfigAliasConverter.processFiles(
        [relativePath],
        tsconfigPath,
      )

      expect(result.totalCount).toBe(1)
      expect(result.modifiedCount).toBe(1)
    } finally {
      process.chdir(originalCwd)
    }
  })
})
