# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2.0.0] - 2025-11-10

### ⚠️ BREAKING CHANGES
- **API now requires `userId` parameter** in PDF screenshot requests
- Changed storage structure from `test/{filename}` to `pdf_thumbnails/{userId}/{filename}`

### Added
- User-specific folder organization for PDF thumbnails
- `userId` parameter to `PdfScreenshotRequest` type

### Changed
- PDF thumbnails now stored in user-specific folders: `pdf_thumbnails/{userId}/`

### Fixed
- Updated Swagger schema to include `userId` parameter validation

## [1.2.0] - 2025-11-10

### Added
- Bearer token authentication for API security
- Multiple API key support via environment variables
- Public `/docs` endpoint for API documentation
- Reusable response schemas for consistent error handling
- Comprehensive authentication documentation
- Axios usage examples (JavaScript & TypeScript)

### Changed
- Moved Swagger registration before authentication to keep docs public
- Refactored schema responses into shared components

### Security
- API now requires authentication for all endpoints except `/docs`

## [1.1.0] - 2025-11-10

### Added
- Rate limiting to prevent API abuse
- Global rate limit: 100 requests per minute
- PDF endpoint rate limit: 10 requests per hour per IP
- Rate limit headers in all responses
- Rate limiting configuration file
- Rate limiting documentation (RATE_LIMITING.md)

### Changed
- Enhanced Swagger documentation with rate limit information

## [1.0.0] - 2025-11-10

### Added
- Initial release
- PDF screenshot generation using pdfjs-dist and node-canvas
- Automatic upload to Cloudflare R2 storage
- Fastify server with TypeScript
- Interactive Swagger/OpenAPI documentation
- PM2 process management configuration
- Environment-based configuration
- Comprehensive error handling
- Health check endpoint

### Technical
- PDF rendering at 1.5x scale for better quality
- PNG output format
- Automatic thumbnail naming based on PDF filename
- Support for PDFs from any public URL

## Version Format

This project uses [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes (e.g., 1.0.0 → 2.0.0)
- **MINOR**: New features, backward compatible (e.g., 1.0.0 → 1.1.0)
- **PATCH**: Bug fixes (e.g., 1.0.0 → 1.0.1)

[Unreleased]: https://github.com/yourusername/pdf-screenshot/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/yourusername/pdf-screenshot/compare/v1.2.0...v2.0.0
[1.2.0]: https://github.com/yourusername/pdf-screenshot/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/yourusername/pdf-screenshot/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/yourusername/pdf-screenshot/releases/tag/v1.0.0


