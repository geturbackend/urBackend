# Changelog

All notable changes to `@urbackend/react` are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this package adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.2.0] - 2026-06-13

### Added
- Expanded `<UrAuth>` customization with object-form `providers` config (`google`, `github`, `emailPassword`)
- Added `enableEmailPassword` shorthand toggle support
- Added customizable `colors`, `branding`, and `labels` props for theme/copy overrides
- Added label alias support (for example: `signInTitle`/`loginTitle`, `signInButton`/`loginButton`)
- Added configurable branding logo URL support (`branding.logoUrl` alias)

### Changed
- Internal theme typing for `<UrAuth>` uses `ThemeMode` while keeping public values as `'light' | 'dark'`
- Defaults remain backward compatible with v0.1.x when new props are omitted

