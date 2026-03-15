// ============ TEST FRAMEWORK ============

const resultsEl = document.getElementById('testResults');
let testsPassed = 0;
let testsFailed = 0;

function logResult(status, testName, detail) {
    const div = document.createElement('div');
    div.className = status;
    const detailStr = detail ? ': ' + detail : '';
    div.textContent = `[${status.toUpperCase()}] ${testName}${detailStr}`;
    resultsEl.appendChild(div);
    if (status === 'pass') testsPassed++;
    else testsFailed++;
}

function assert(condition, testName, detail) {
    if (condition) logResult('pass', testName);
    else logResult('fail', testName, detail || 'assertion failed');
}

function assertEqual(actual, expected, testName) {
    if (actual === expected) logResult('pass', testName);
    else logResult('fail', testName, `expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// ============ HELPERS ============

function setupRenderState(options) {
    const o = options || {};
    els.scale.value = o.scale || 1;
    els.dpi.value = o.dpi || 72;
    els.marginMm.value = o.marginMm !== undefined ? o.marginMm : 0;
    els.lineGap.value = o.lineGap !== undefined ? o.lineGap : 0;
    els.gridSize.value = o.gridSize || '5x5';
    els.compactMode.checked = o.compact7 || false;
    els.extremeMode.checked = o.extreme7 || false;
    els.includeLegend.checked = o.legend7 || false;
    els.transliterate.checked = o.transliterate7 || false;
    els.includeHeader.checked = o.header7 || false;
    els.addBorders.checked = o.borders7 || false;
    els.includePageNumbers.checked = o.pageNumbers7 || false;
    els.headerText.value = o.headerText || CONFIG.DEFAULT_HEADER_TEXT;
}

function countBlackPixels(canvases) {
    let count = 0;
    for (const canvas of canvases) {
        const ctx = canvas.getContext('2d');
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        for (let i = 0; i < data.length; i += 4) {
            const isBlack = data[i] === 0 && data[i + 1] === 0 && data[i + 2] === 0;
            if (isBlack) count++;
        }
    }
    return count;
}

function countGlyphPixels(text, chars, maxRows, maxCols) {
    let count = 0;
    for (const c of text) {
        if (c === ' ' || c === '\n') continue;
        const grid = chars[c] || chars['.notdef'] || [];
        for (let r = 0; r < Math.min(grid.length, maxRows); r++) {
            const row = grid[r] || [];
            for (let col = 0; col < Math.min(row.length, maxCols); col++) {
                if (row[col].includes('#')) count++;
            }
        }
    }
    return count;
}

// ============ PURE FUNCTION TESTS ============

function testSplitLineRoundTrip() {
    const cases = [
        ["hello world", false, "hello world"],
        ["hello  world", false, "hello  world"],
        ["hello  world", true, "hello world"],
        ["", false, ""],
        ["hello", false, "hello"],
        [" hello", false, " hello"],
        ["hello ", false, "hello "],
        ["   ", false, "   "],
        ["  hello", true, " hello"],
    ];
    for (const [input, compact7, expected] of cases) {
        const joined = splitLineIntoWords(input, compact7).join("");
        assertEqual(joined, expected,
            `splitLineIntoWords("${input}", compact=${compact7})`);
    }
}

function testNormalizeTextAscii() {
    assertEqual(normalizeText("Hello World", false, false, ""), "Hello World",
        "normalizeText: ASCII passthrough");
}

function testNormalizeTextTypographic() {
    assert(normalizeText("hello\u2014world", false, false, "").includes("-"),
        "normalizeText: em dash replaced with -");
    assertEqual(normalizeText("wait\u2026", false, false, ""), "wait...",
        "normalizeText: ellipsis replaced");
    assert(!normalizeText("a\tb", false, false, "").includes("\t"),
        "normalizeText: tab replaced");
}

function testNormalizeTextExtreme() {
    assertEqual(normalizeText("Hello World", true, false, ""), "hello world",
        "normalizeText: extreme lowercases");
}

function testNormalizeTextCompact() {
    assertEqual(normalizeText("hello\n\nworld", false, true, ""), "hello world",
        "normalizeText: compact collapses whitespace");
}

function testNormalizeTextLegend() {
    const result = normalizeText("text", false, false, "LEGEND");
    assert(result.startsWith("[[CHARACTERS LEGEND: LEGEND"),
        "normalizeText: legend prepended");
    assert(result.endsWith("text"),
        "normalizeText: text preserved after legend");
}

function testEncodeUnknownCharsPassthrough() {
    const known = new Set(['a', 'b', 'c', ' ', '\n']);
    assertEqual(encodeUnknownChars("abc", known), "abc",
        "encodeUnknownChars: known chars pass through");
}

function testEncodeUnknownCharsNeverDrops() {
    const known = new Set(['a', 'b', ' ', '\n']);
    const result = encodeUnknownChars("aXb", known);
    assert(result.length > 3,
        "encodeUnknownChars: unknown char encoded (output longer, not shorter)");
    assert(result.includes("[\\u"),
        "encodeUnknownChars: unknown char gets [\\uXXXX] encoding");
}

function testEncodeUnknownCharsAllUnknown() {
    const known = new Set([' ', '\n']);
    const result = encodeUnknownChars("XYZ", known);
    assert(result.length >= 3,
        "encodeUnknownChars: all-unknown text encoded, none dropped");
}

function testTransliterateRussianBasic() {
    const result = transliterateRussian("\u043F\u0440\u0438\u0432\u0435\u0442");
    assertEqual(result, "privjet",
        "transliterateRussian: \u043F\u0440\u0438\u0432\u0435\u0442 \u2192 privjet");
}

function testTransliterateRussianPassthrough() {
    assertEqual(transliterateRussian("Hello"), "Hello",
        "transliterateRussian: English text untouched");
}

function testApplySubscriptDigitsAll() {
    assertEqual(applySubscriptDigits("0123456789"), "\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089",
        "applySubscriptDigits: all digits replaced");
}

function testApplySubscriptDigitsNoDigits() {
    assertEqual(applySubscriptDigits("hello"), "hello",
        "applySubscriptDigits: text without digits unchanged");
}

function testParseCsvLineSimple() {
    assertEqual(parseCsvLine("a,b,c").join("|"), "a|b|c",
        "parseCsvLine: simple fields");
}

function testParseCsvLineFontRow() {
    assertEqual(parseCsvLine(",#,#,#,,").join("|"), "|#|#|#||",
        "parseCsvLine: font data row");
}

function testParseCsvMultiChar() {
    const csv = [
        'A,,,,,', ',#,#,#,,', ',#,,#,,', ',#,,#,,', ',#,#,#,,', ',#,,#,,',
        'B,,,,,', ',#,#,,,', ',#,,,,', ',#,,,,', ',#,,,,', ',#,#,,,'
    ].join('\n');
    const chars = parseCsv(csv);
    assert('A' in chars, "parseCsv: character A parsed");
    assert('B' in chars, "parseCsv: character B parsed");
    assertEqual(chars['A'].length, 5, "parseCsv: A has 5 rows");
    assertEqual(chars['B'].length, 5, "parseCsv: B has 5 rows");
}

function testGetCharWidthNormal() {
    const gridA = [
        ["#", "#", "#", "", ""],
        ["#", "", "#", "", ""],
        ["#", "", "#", "", ""],
        ["#", "#", "#", "", ""],
        ["#", "", "#", "", ""]
    ];
    assertEqual(getCharWidth(gridA, 5), 4,
        "getCharWidth: A width = 4 (3 cols + 1 gap)");
}

function testGetCharWidthEmpty() {
    assertEqual(getCharWidth([], 5), 2, "getCharWidth: empty grid returns 2");
    assertEqual(getCharWidth(null, 5), 2, "getCharWidth: null grid returns 2");
}

// ============ PIXEL-PERFECT RENDERING TESTS ============
// These verify that every character from the input produces the exact expected
// number of black pixels on the canvas. If any character is lost, the count
// will be wrong.

async function testRenderSingleChar() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');
    await renderText("A");

    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels("A", chars, 5, 5);
    assertEqual(actual, expected,
        `render "A": exactly ${expected} black pixels at scale=1`);
}

async function testRenderThreeChars() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');
    await renderText("ABC");

    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels("ABC", chars, 5, 5);
    assertEqual(actual, expected,
        `render "ABC": exactly ${expected} pixels (no text lost)`);
}

async function testRenderUppercaseAlphabet() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');
    const text = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 5);
    assertEqual(actual, expected,
        `render A-Z: all 26 uppercase letters (${expected} pixels)`);
}

async function testRenderLowercaseAlphabet() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');
    const text = "abcdefghijklmnopqrstuvwxyz";

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 5);
    assertEqual(actual, expected,
        `render a-z: all 26 lowercase letters (${expected} pixels)`);
}

async function testRenderDigits() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');
    const text = "0123456789";

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 5);
    assertEqual(actual, expected,
        `render 0-9: all 10 digits (${expected} pixels)`);
}

async function testRenderPunctuation() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');
    const text = ".,;:!?-()";

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 5);
    assertEqual(actual, expected,
        `render punctuation: ${text} (${expected} pixels)`);
}

async function testSpacesAddNoBlackPixels() {
    setupRenderState({ scale: 1 });
    await fetchFont('5x5');

    await renderText("AB");
    const noSpacePixels = countBlackPixels(currentCanvases);

    await renderText("A B");
    const withSpacePixels = countBlackPixels(currentCanvases);

    assertEqual(noSpacePixels, withSpacePixels,
        "spaces add zero black pixels, text chars preserved");
}

async function testNewlinesDontLoseText() {
    setupRenderState({ scale: 1 });
    await fetchFont('5x5');

    await renderText("AB");
    const oneLinePixels = countBlackPixels(currentCanvases);

    await renderText("A\nB");
    const twoLinePixels = countBlackPixels(currentCanvases);

    assertEqual(oneLinePixels, twoLinePixels,
        "newlines reposition but don't lose text");
}

async function testScale2Produces4xPixels() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');

    await renderText("A");
    const scale1 = countBlackPixels(currentCanvases);

    setupRenderState({ scale: 2 });
    await renderText("A");
    const scale2 = countBlackPixels(currentCanvases);

    assertEqual(scale2, scale1 * 4,
        `scale=2 produces 4x pixels (${scale1} -> ${scale2})`);
}

async function testRenderSentence() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');
    const text = "Hello, World!";

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 5);
    assertEqual(actual, expected,
        `render sentence: all chars rendered (${expected} pixels)`);
}

async function testRenderLongParagraph() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');
    const text = "The quick brown fox jumps over the lazy dog. " +
        "Pack my box with five dozen liquor jugs.";

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 5);
    assertEqual(actual, expected,
        `render paragraph: all chars rendered (${expected} pixels)`);
}

// ============ HEADER TESTS ============

async function testHeaderAt2xScale() {
    const chars = await fetchFont('5x5');
    const scaleMult = CONFIG.HEADER_SCALE_MULTIPLIER;
    const factor = scaleMult * scaleMult;

    setupRenderState({ scale: 1 });
    await renderText("AB");
    const bodyPixels = countBlackPixels(currentCanvases);

    setupRenderState({ scale: 1, header7: true, headerText: "AB" });
    await renderText("");
    const headerPixels = countBlackPixels(currentCanvases);

    assertEqual(headerPixels, bodyPixels * factor,
        `header at ${scaleMult}x scale = ${factor}x pixels (${bodyPixels} -> ${headerPixels})`);
}

async function testHeaderPlusBody() {
    setupRenderState({ scale: 1, header7: true, headerText: "AB" });
    const chars = await fetchFont('5x5');
    const scaleMult = CONFIG.HEADER_SCALE_MULTIPLIER;
    const factor = scaleMult * scaleMult;

    await renderText("CD");
    const total = countBlackPixels(currentCanvases);

    const headerExpected = countGlyphPixels("AB", chars, 5, 5) * factor;
    const bodyExpected = countGlyphPixels("CD", chars, 5, 5);
    assertEqual(total, headerExpected + bodyExpected,
        `header(${headerExpected}) + body(${bodyExpected}) = ${headerExpected + bodyExpected} total`);
}

async function testHeaderDisabled() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');

    await renderText("AB");
    const withoutHeader = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels("AB", chars, 5, 5);

    assertEqual(withoutHeader, expected,
        "header disabled: only body pixels rendered");
}

// ============ COMPACT & EXTREME MODE TESTS ============

async function testCompactPreservesWords() {
    setupRenderState({ scale: 1, compact7: true });
    const chars = await fetchFont('5x5');
    const text = "Hello   World\n\nFoo";
    const compacted = "Hello World Foo";

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(compacted, chars, 5, 5);
    assertEqual(actual, expected,
        "compact mode: all non-whitespace characters preserved");
}

async function testExtremeModeLowercases() {
    setupRenderState({ scale: 1, extreme7: true });
    const chars = await fetchFont('5x5');

    await renderText("AB");
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels("ab", chars, 5, 5);
    assertEqual(actual, expected,
        "extreme mode: text lowercased, all chars rendered");
}

// ============ MULTI-PAGE TEST ============

async function testMultiPageNoTextLost() {
    setupRenderState({ scale: 5, dpi: 72, marginMm: 5 });
    const chars = await fetchFont('5x5');
    const text = "ABCDEFGHIJ ".repeat(300).trim();

    await renderText(text);

    assert(currentCanvases.length >= 2,
        `multi-page: ${currentCanvases.length} pages created (expected >=2)`);

    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 5) * 25;
    assertEqual(actual, expected,
        `multi-page: all ${text.length} chars rendered across ${currentCanvases.length} pages`);
}

// ============ MULTI-FONT TESTS ============

async function testRender5x4Font() {
    setupRenderState({ scale: 1, gridSize: '5x4' });
    const chars = await fetchFont('5x4');
    const text = "ABCDE";

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 4);
    assertEqual(actual, expected,
        `5x4 font: "${text}" renders correctly (${expected} pixels)`);
}

async function testRender4x3Font() {
    setupRenderState({ scale: 1, gridSize: '4x3' });
    const chars = await fetchFont('4x3');
    const text = "ABCDE";

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 4, 3);
    assertEqual(actual, expected,
        `4x3 font: "${text}" renders correctly (${expected} pixels)`);
}

// ============ TRANSLITERATION TEST ============

async function testTransliterateEncodesUnknown() {
    setupRenderState({ scale: 1, transliterate7: true });
    const chars = await fetchFont('5x5');
    const knownChars = new Set([...Object.keys(chars), ' ', '\n']);

    await renderText("A\u4e2dB");
    const actual = countBlackPixels(currentCanvases);

    let processedText = normalizeText("A\u4e2dB", false, false, "");
    processedText = encodeUnknownChars(processedText, knownChars);
    const expected = countGlyphPixels(processedText, chars, 5, 5);

    assertEqual(actual, expected,
        `transliterate: unknown char encoded, not lost (rendered "${processedText}")`);
}

// ============ FONT VALIDATION ============

async function testEveryGlyphHasPixels() {
    const chars = await fetchFont('5x5');
    const emptyGlyphs = [];

    for (const [name, grid] of Object.entries(chars)) {
        if (name === '.notdef') continue;
        let hasPixel7 = false;
        for (let r = 0; r < Math.min(grid.length, 5); r++) {
            for (let c = 0; c < Math.min((grid[r] || []).length, 5); c++) {
                if (grid[r][c].includes('#')) hasPixel7 = true;
            }
        }
        if (!hasPixel7) emptyGlyphs.push(name);
    }

    assertEqual(emptyGlyphs.length, 0,
        `5x5 font: all ${Object.keys(chars).length} glyphs have pixels` +
        (emptyGlyphs.length ? ` (empty: ${emptyGlyphs.join(', ')})` : ''));
}

// ============ BORDER TESTS ============

async function testBordersAddPixels() {
    setupRenderState({ scale: 1, marginMm: 10, dpi: 72 });
    const chars = await fetchFont('5x5');
    await renderText("A");
    const noBorderPixels = countBlackPixels(currentCanvases);

    setupRenderState({ scale: 1, marginMm: 10, dpi: 72, borders7: true });
    await renderText("A");
    const withBorderPixels = countBlackPixels(currentCanvases);

    assert(withBorderPixels > noBorderPixels,
        `borders add pixels: ${noBorderPixels} without -> ${withBorderPixels} with`);
}

async function testBordersDisabledNoExtraPixels() {
    setupRenderState({ scale: 1, marginMm: 10, dpi: 72, borders7: false });
    const chars = await fetchFont('5x5');
    await renderText("A");
    const noBorderPixels = countBlackPixels(currentCanvases);

    const expected = countGlyphPixels("A", chars, 5, 5);
    assertEqual(noBorderPixels, expected,
        "borders disabled: exact glyph pixels only, no extras");
}

async function testBordersSkippedWhenMarginTooSmall() {
    setupRenderState({ scale: 1, marginMm: 5, dpi: 72, borders7: true });
    const chars = await fetchFont('5x5');
    await renderText("A");
    const smallMarginPixels = countBlackPixels(currentCanvases);

    const expected = countGlyphPixels("A", chars, 5, 5);
    assertEqual(smallMarginPixels, expected,
        "borders skipped with small margin: exact glyph pixels only");
}

async function testBordersScaleWithDpi() {
    setupRenderState({ scale: 1, marginMm: 10, dpi: 72, borders7: true });
    await fetchFont('5x5');
    await renderText("A");
    const lowDpiPixels = countBlackPixels(currentCanvases);

    setupRenderState({ scale: 1, marginMm: 10, dpi: 150, borders7: true });
    await renderText("A");
    const highDpiPixels = countBlackPixels(currentCanvases);

    assert(highDpiPixels > lowDpiPixels,
        `borders scale with DPI: ${lowDpiPixels} @72dpi -> ${highDpiPixels} @150dpi`);
}

async function testBordersOnMultiplePages() {
    setupRenderState({ scale: 5, dpi: 72, marginMm: 10, borders7: true });
    const chars = await fetchFont('5x5');
    const text = "ABCDEFGHIJ ".repeat(300).trim();
    await renderText(text);

    assert(currentCanvases.length >= 2,
        `borders multi-page: ${currentCanvases.length} pages created`);

    const glyphPixels = countGlyphPixels(text, chars, 5, 5) * 25;
    const totalPixels = countBlackPixels(currentCanvases);
    assert(totalPixels > glyphPixels,
        `borders multi-page: total pixels (${totalPixels}) > glyph pixels (${glyphPixels})`);
}

// ============ FORCE-BREAK LONG WORD TESTS ============

async function testForceBreakLongWordNoSpaces() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');
    const text = "A".repeat(200);

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 5);
    assertEqual(actual, expected,
        `force-break: long word (200 chars) without spaces, all pixels rendered`);
}

async function testForceBreakLongWordWithMargin() {
    setupRenderState({ scale: 2, marginMm: 10, dpi: 72 });
    const chars = await fetchFont('5x5');
    const text = "X".repeat(100);

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 5) * 4;
    assertEqual(actual, expected,
        `force-break with margin: long word (100 chars, scale=2), all pixels rendered`);
}

async function testForceBreakLongWordMultiPage() {
    setupRenderState({ scale: 5, dpi: 72, marginMm: 5 });
    const chars = await fetchFont('5x5');
    const text = "B".repeat(2000);

    await renderText(text);

    assert(currentCanvases.length >= 2,
        `force-break multi-page: ${currentCanvases.length} pages created (expected >=2)`);

    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 5) * 25;
    assertEqual(actual, expected,
        `force-break multi-page: all 2000 chars rendered across ${currentCanvases.length} pages`);
}

async function testForceBreakMixedLongAndShortWords() {
    setupRenderState({ scale: 1 });
    const chars = await fetchFont('5x5');
    const text = "Hi " + "A".repeat(200) + " Ok";

    await renderText(text);
    const actual = countBlackPixels(currentCanvases);
    const expected = countGlyphPixels(text, chars, 5, 5);
    assertEqual(actual, expected,
        `force-break mixed: short words + long word, all pixels rendered`);
}

// ============ PAGE NUMBER TESTS ============

async function testPageNumbersAddPixels() {
    setupRenderState({ scale: 1, marginMm: 10, dpi: 72 });
    const chars = await fetchFont('5x5');
    await renderText("A");
    const noPageNumPixels = countBlackPixels(currentCanvases);

    setupRenderState({ scale: 1, marginMm: 10, dpi: 72, pageNumbers7: true });
    await renderText("A");
    const withPageNumPixels = countBlackPixels(currentCanvases);

    assert(withPageNumPixels > noPageNumPixels,
        `page numbers add pixels: ${noPageNumPixels} without -> ${withPageNumPixels} with`);
}

// ============ TEST RUNNER ============

function showSummary() {
    const div = document.createElement('div');
    const total = testsPassed + testsFailed;
    div.className = 'summary ' + (testsFailed > 0 ? 'fail' : 'pass');
    div.textContent = `${total} tests: ${testsPassed} passed, ${testsFailed} failed`;
    resultsEl.appendChild(div);
    console.log(`Tests complete: ${testsPassed} passed, ${testsFailed} failed`);
}

async function runAllTests() {
    resultsEl.innerHTML = '';

    // Wait for script.js initial timeout to complete
    await new Promise(r => setTimeout(r, 500));

    // --- Pure function tests ---
    testSplitLineRoundTrip();
    testNormalizeTextAscii();
    testNormalizeTextTypographic();
    testNormalizeTextExtreme();
    testNormalizeTextCompact();
    testNormalizeTextLegend();
    testEncodeUnknownCharsPassthrough();
    testEncodeUnknownCharsNeverDrops();
    testEncodeUnknownCharsAllUnknown();
    testTransliterateRussianBasic();
    testTransliterateRussianPassthrough();
    testApplySubscriptDigitsAll();
    testApplySubscriptDigitsNoDigits();
    testParseCsvLineSimple();
    testParseCsvLineFontRow();
    testParseCsvMultiChar();
    testGetCharWidthNormal();
    testGetCharWidthEmpty();

    // --- Pixel-perfect rendering tests ---
    await testRenderSingleChar();
    await testRenderThreeChars();
    await testRenderUppercaseAlphabet();
    await testRenderLowercaseAlphabet();
    await testRenderDigits();
    await testRenderPunctuation();
    await testSpacesAddNoBlackPixels();
    await testNewlinesDontLoseText();
    await testScale2Produces4xPixels();
    await testRenderSentence();
    await testRenderLongParagraph();

    // --- Header tests ---
    await testHeaderAt2xScale();
    await testHeaderPlusBody();
    await testHeaderDisabled();

    // --- Compact & extreme ---
    await testCompactPreservesWords();
    await testExtremeModeLowercases();

    // --- Multi-page ---
    await testMultiPageNoTextLost();

    // --- Multi-font ---
    await testRender5x4Font();
    await testRender4x3Font();

    // --- Transliteration ---
    await testTransliterateEncodesUnknown();

    // --- Border tests ---
    await testBordersAddPixels();
    await testBordersDisabledNoExtraPixels();
    await testBordersSkippedWhenMarginTooSmall();
    await testBordersScaleWithDpi();
    await testBordersOnMultiplePages();

    // --- Force-break long word tests ---
    await testForceBreakLongWordNoSpaces();
    await testForceBreakLongWordWithMargin();
    await testForceBreakLongWordMultiPage();
    await testForceBreakMixedLongAndShortWords();

    // --- Page Number tests ---
    await testPageNumbersAddPixels();

    // --- Font validation ---
    await testEveryGlyphHasPixels();

    showSummary();
}

runAllTests();
