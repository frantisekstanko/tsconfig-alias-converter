# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] - 2025-10-08

### Changed

- **BREAKING**: The CLI command now runs in dry mode by default.
  Use the `--write` flag to apply changes to files. The command will
  exit with error code `1` if dry mode detects files required for modification.

- API: parameter `tsconfigPath` to `TsconfigAliasConverter.processFiles()`
  is now required

## [0.1.1] - 2025-10-08

- Chore: docs
- Publish the package with GitHub Actions

## [0.1.0] - 2025-10-08

### Added

- Initial release
- CLI tool for converting relative imports to tsconfig path aliases
- Programmatic API for custom integrations
- Automatic reading of path aliases from tsconfig.json
- Support for custom tsconfig paths
- Comprehensive test suite
- TypeScript support with full type definitions

[0.2.0]: https://github.com/frantisekstanko/tsconfig-alias-converter/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/frantisekstanko/tsconfig-alias-converter/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/frantisekstanko/tsconfig-alias-converter/releases/tag/v0.1.0
