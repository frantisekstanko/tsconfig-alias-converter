import { TsconfigReader } from '../src/TsconfigReader'
import * as fs from 'node:fs'
import * as path from 'node:path'

describe('TsconfigReader', () => {
  const tempDir = path.join(__dirname, '__temp__')
  const tsconfigPath = path.join(tempDir, 'tsconfig.json')

  beforeEach(() => {
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true })
    }
  })

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  })

  it('should read alias configurations from tsconfig.json', () => {
    const tsconfigContent = {
      compilerOptions: {
        baseUrl: './',
        paths: {
          '@/*': ['src/*'],
          '@Tests/*': ['tests/*'],
        },
      },
    }

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent), 'utf8')

    const aliasConfigurations =
      TsconfigReader.readAliasConfigurations(tsconfigPath)

    expect(aliasConfigurations).toHaveLength(2)
    expect(aliasConfigurations[0].prefix).toBe('@')
    expect(aliasConfigurations[0].path).toContain('src')
    expect(aliasConfigurations[1].prefix).toBe('@Tests')
    expect(aliasConfigurations[1].path).toContain('tests')
  })

  it('should return empty array when paths are not defined', () => {
    const tsconfigContent = {
      compilerOptions: {
        baseUrl: './',
      },
    }

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent), 'utf8')

    const aliasConfigurations =
      TsconfigReader.readAliasConfigurations(tsconfigPath)

    expect(aliasConfigurations).toHaveLength(0)
  })

  it('should handle relative baseUrl correctly', () => {
    const tsconfigContent = {
      compilerOptions: {
        baseUrl: './src',
        paths: {
          '@/*': ['*'],
        },
      },
    }

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent), 'utf8')

    const aliasConfigurations =
      TsconfigReader.readAliasConfigurations(tsconfigPath)

    expect(aliasConfigurations).toHaveLength(1)
    expect(aliasConfigurations[0].prefix).toBe('@')
    expect(aliasConfigurations[0].path).toContain('src')
  })

  it('should skip aliases with empty target paths', () => {
    const tsconfigContent = {
      compilerOptions: {
        baseUrl: './',
        paths: {
          '@Empty/*': [],
          '@Valid/*': ['src/*'],
        },
      },
    }

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent), 'utf8')

    const aliasConfigurations =
      TsconfigReader.readAliasConfigurations(tsconfigPath)

    expect(aliasConfigurations).toHaveLength(1)
    expect(aliasConfigurations[0].prefix).toBe('@Valid')
  })

  it('should use default baseUrl when compilerOptions is undefined', () => {
    const tsconfigContent = {}

    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfigContent), 'utf8')

    const aliasConfigurations =
      TsconfigReader.readAliasConfigurations(tsconfigPath)

    expect(aliasConfigurations).toHaveLength(0)
  })
})
