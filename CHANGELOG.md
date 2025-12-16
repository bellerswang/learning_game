# Changelog

## [Unreleased] - 2025-12-16

### Added
- **Sentence Database**: Created `sentence_db.json` containing 1,685 unique sentences across 4 difficulty levels.
- **Embedded Data**: Created `sentence_data.js` to embed the sentence database directly into the application, resolving CORS issues with local file execution.
- **Improved Sentence Loading**: Updated `lab_engine.js` to primarily use the embedded sentence database, with improved fallback logic and error handling.

### Changed
- **Sentence Generation**: Switched from on-the-fly generation/fetching to using a pre-generated, locally stored sentence database.
- **Word Library**: Updated `lab_engine.js` to use a minimal embedded word library for word type verification, removing the dependency on external JSON files for this purpose.
- **File Structure**: Cleaned up the `English_station` directory by removing unused files: `word_library.json`, `word_bank_v2.json`, `word_data.js`, `level_data.js`, and `word_library_expanded.json`.
- **HTML Structure**: Updated `sentence_lab.html` to include `sentence_data.js` and removed references to deleted scripts.

### Fixed
- **Level Lookup**: Fixed a bug in `lab_engine.js` where integer difficulty levels were not correctly matching string keys in the sentence database.
- **CORS Errors**: Resolved issues where `fetch()` calls would fail when running the game directly via `file:///` protocol by using embedded data.
