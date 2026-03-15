# Running Tests

The test suite verifies that the rendering pipeline in `docs/script.js` faithfully represents all input text — no characters are lost, skipped, or corrupted during rendering.

## How to run

1. Start a local server from the `docs` directory:

```bash
cd docs
python -m http.server 8765
```

2. Open http://localhost:8765/test.html in your browser.

Tests run automatically on page load. Results appear as green (PASS) or red (FAIL) lines, with a summary at the bottom.

## What the tests cover

### Pure function tests (34 assertions)

- **splitLineIntoWords** — round-trip: joining words reconstructs the original line. Covers normal mode, compact mode, empty strings, leading/trailing spaces.
- **normalizeText** — ASCII passthrough, typographic character replacement, extreme mode (lowercase), compact mode (whitespace collapse), legend prepend.
- **encodeUnknownChars** — known chars pass through, unknown chars get `[\uXXXX]` encoding (never silently dropped).
- **transliterateRussian** — Russian text transliterated, English text left untouched.
- **applySubscriptDigits** — digit-to-subscript mapping.
- **parseCsvLine / parseCsv** — CSV font definition parsing.
- **getCharWidth** — character width calculation from glyph grids.

### Pixel-perfect rendering tests (11 tests)

These are the core "no text lost" tests. They render text on a real canvas, count every black pixel, and verify the count exactly matches the expected glyph pixel count from the font CSV. If even one character is skipped or rendered incorrectly, the count will be wrong.

- Single character, multi-character, full uppercase/lowercase alphabet, digits, punctuation.
- Spaces add zero black pixels (positioning only).
- Newlines reposition text but lose no characters.
- Scale=2 produces exactly 4x the pixels of scale=1.
- Full sentence and long paragraph rendering.

### Header tests (3 tests)

- Header at 2x scale produces exactly 4x the pixel count of the same text at body scale.
- Header + body combined pixel count equals the exact sum of both.
- Header disabled produces only body pixels.

### Mode tests (2 tests)

- Compact mode preserves all non-whitespace characters.
- Extreme mode lowercases text correctly.

### Multi-page test (1 test)

- Long text spanning multiple pages: total pixel count across all pages matches expected.

### Multi-font tests (2 tests)

- 5x4 and 4x3 fonts verified with exact pixel counts.

### Transliteration test (1 test)

- Unknown characters are encoded as `[\uXXXX]`, not dropped.

### Font validation (1 test)

- Every glyph defined in the 5x5 font has at least one black pixel.
