# tsconfig-alias-converter

[![CI](https://github.com/frantisekstanko/tsconfig-alias-converter/actions/workflows/ci.yml/badge.svg)](https://github.com/frantisekstanko/tsconfig-alias-converter/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/@frantisekstanko/tsconfig-alias-converter.svg)](https://www.npmjs.com/package/@frantisekstanko/tsconfig-alias-converter)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)

Convert relative imports to TypeScript path aliases automatically, based on your `tsconfig.json` configuration.

## Features

- 🎯 **Zero configuration** - Reads path aliases directly from `tsconfig.json`
- 🚀 **CLI tool** - Easy to integrate into your workflow
- 📦 **Programmatic API** - Use it in your own tools
- 🔒 **Type-safe** - Full TypeScript support
- 🏗️ **Clean architecture** - Well-structured and maintainable code

## Installation

```bash
npm install @frantisekstanko/tsconfig-alias-converter
```

## Usage

### CLI

Convert imports in specific files:

```bash
npx tsconfig-alias-converter src/**/*.ts
```

Specify a custom tsconfig path:

```bash
npx tsconfig-alias-converter src/**/*.ts --tsconfig=./tsconfig.build.json
```

### Programmatic API

```typescript
import { TsconfigAliasConverter } from '@frantisekstanko/tsconfig-alias-converter'

const result = TsconfigAliasConverter.processFiles(
  ['src/file1.ts', 'src/file2.ts'],
  './tsconfig.json',
)

console.log(`Modified ${result.modifiedCount} of ${result.totalCount} files`)
```

### Advanced Usage

Use individual components for more control:

```typescript
import {
  TsconfigReader,
  ImportRewriter,
  FileProcessor,
} from '@frantisekstanko/tsconfig-alias-converter'

const aliasConfigs = TsconfigReader.readAliasConfigurations('./tsconfig.json')
const rewriter = new ImportRewriter(aliasConfigs)
const processor = new FileProcessor(rewriter)

const wasModified = processor.processFile('./src/example.ts')
```

## How It Works

Given a `tsconfig.json` with path aliases:

```json
{
  "compilerOptions": {
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@tests/*": ["tests/*"]
    }
  }
}
```

The tool will convert relative imports:

```typescript
import { helper } from '../../../utils/helper.js'
import { config } from '../../config.js'
```

To alias imports:

```typescript
import { helper } from '@/utils/helper.js'
import { config } from '@/config.js'
```

## Integration

### With package.json scripts

```json
{
  "scripts": {
    "fix-imports": "tsconfig-alias-converter src/**/*.ts tests/**/*.ts"
  }
}
```

### With git hooks (using husky)

```bash
npx husky add .husky/pre-commit "npm run fix-imports"
```

### With lint-staged

```json
{
  "lint-staged": {
    "*.ts": ["tsconfig-alias-converter"]
  }
}
```

## API

### `TsconfigAliasConverter.processFiles(filePaths, tsconfigPath?)`

Process multiple files and convert their imports.

- `filePaths`: Array of file paths to process
- `tsconfigPath`: Optional path to tsconfig.json (defaults to `./tsconfig.json`)
- Returns: `{ modifiedCount: number, totalCount: number }`

### `TsconfigReader.readAliasConfigurations(tsconfigPath)`

Read and parse path alias configurations from tsconfig.json.

- `tsconfigPath`: Path to tsconfig.json
- Returns: `AliasConfiguration[]`

### `ImportRewriter`

Rewrite imports in file content.

```typescript
const rewriter = new ImportRewriter(aliasConfigurations)
const { modified, content } = rewriter.rewriteImportsInFile(
  filePath,
  fileContent,
)
```

### `FileProcessor`

Process files on disk.

```typescript
const processor = new FileProcessor(importRewriter)
const wasModified = processor.processFile(filePath)
```

## Requirements

- Node.js >= 20.0.0
- npm >= 10.0.0

## License

MIT © Frantisek Stanko
