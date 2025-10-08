#!/usr/bin/env node

import { glob } from 'glob'
import { TsconfigAliasConverter } from './TsconfigAliasConverter.js'

const targetFiles = process.argv.slice(2)

if (targetFiles.length === 0) {
  console.error(
    'Usage: tsconfig-alias-converter <file1> [file2] [...] [--tsconfig=path/to/tsconfig.json]',
  )
  process.exit(1)
}

const tsconfigArg = targetFiles.find((arg) => arg.startsWith('--tsconfig='))

const tsconfigPath = tsconfigArg
  ? tsconfigArg.replace('--tsconfig=', '')
  : './tsconfig.json'

const patterns = targetFiles.filter((arg) => !arg.startsWith('--tsconfig='))

const files = patterns.flatMap((pattern) => {
  if (pattern === '.' || pattern.endsWith('/')) {
    const normalized = pattern === '.' ? './' : pattern
    return glob.sync(`${normalized}**/*.{ts,tsx}`, {
      ignore: ['**/node_modules/**'],
    })
  }
  const matches = glob.sync(pattern)
  return matches.length > 0 ? matches : [pattern]
})

const { modifiedCount, totalCount } = TsconfigAliasConverter.processFiles(
  files,
  tsconfigPath,
)

console.log(
  `Fixed imports in ${String(modifiedCount)} of ${String(totalCount)} files`,
)
