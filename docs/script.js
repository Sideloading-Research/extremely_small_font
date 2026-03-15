// Note: you may need to change these in other places too
const CONFIG = {
    HEADER_SCALE_MULTIPLIER: 4,
    DEFAULT_HEADER_TEXT: "IMPORTANT! PRESERVE THIS DOCUMENT.",
    DEFAULT_MARGIN_MM: 10,
    DEFAULT_DPI: 300,
    DEFAULT_SCALE: 2,
    DEBOUNCE_MS: 300
};

// Typographic replacements to normalize input before rendering
const typographicReplacements = {
    '—': '-',    // Em dash
    '–': '-',    // En dash
    '“': '"',    // Left double quotation mark
    '”': '"',    // Right double quotation mark
    '„': '"',    // Double low-9 quotation mark
    '«': '"',    // Left-pointing double angle quotation mark
    '»': '"',    // Right-pointing double angle quotation mark
    '‘': "'",    // Left single quotation mark
    '’': "'",    // Right single quotation mark
    '‚': "'",    // Single low-9 quotation mark
    '‹': "'",    // Single left-pointing angle quotation mark
    '›': "'",    // Single right-pointing angle quotation mark
    '…': '...',  // Horizontal ellipsis
    '. . . .': '....', // Spaced 4-dot ellipsis
    '. . .': '...', // Spaced horizontal ellipsis
    '´': "'",    // Acute accent
    '\t': '    ', // Tab character to 4 spaces
    'À': 'A', 'Æ': 'AE', 'à': 'a', 'â': 'a', 'æ': 'ae', 'ç': 'c',
    'è': 'e', 'ê': 'e', 'ë': 'e', 'î': 'i', 'ï': 'i', 'ô': 'o',
    'ý': 'y', 'œ': 'oe', 'ű': 'u', '\u2007': ' ', '•': '-', '↑': '^',
    '∗': '*', '⋅': '.', '\xa0': ' ', '§': 'S', '¨': '"', '©': '(c)',
    '\xad': '-', '®': '(r)', '°': '*', '±': '+-', '²': '2', '³': '3',
    '·': '.', '¹': '1', 'º': 'o', '¼': '1/4', '×': 'x', 'å': 'a',
    '÷': '/', 'ā': 'a', 'Ć': 'C', 'ć': 'c', 'č': 'c', 'ĺ': 'l',
    'ō': 'o', 'Š': 'S', 'š': 's', 'ž': 'z', 'ɓ': 'b', '˜': '~',
    '́': "'", '̵': '-', 'Π': 'P', 'Σ': 'E', 'α': 'a', 'γ': 'y',
    'η': 'n', 'π': 'pi', 'ρ': 'p', 'χ': 'x', 'І': 'I', 'і': 'i',
    'ѣ': 'e', 'ѫ': 'o', 'ᵢ': 'i', 'ṣ': 's', '\u200b': '', '\u200d': '',
    '‐': '-', '‑': '-', '―': '-', '\u2061': '', '⁰': '0', '⁴': '4',
    '⁵': '5', '⁷': '7', '⁸': '8', '⁹': '9', 'ₐ': 'a', 'ₓ': 'x',
    'ₘ': 'm', '€': 'E', '⃣': '', '№': 'No', '™': 'tm', '⅓': '1/3',
    '←': '<-', '→': '->', '↔': '<->', '⇒': '=>', '∆': '^', '∑': 'E',
    '−': '-', '√': 'v', '∞': 'oo', '≈': '~', '≠': '!=', '≤': '<=',
    '≥': '>=', '─': '-', '│': '|', '└': 'L', '├': '+', '■': '#',
    '▪': '-', '►': '>', '○': 'o', '●': 'O', '◦': 'o', '★': '*',
    '☆': '*', '☐': '[]', '☑': '[x]', '♀': 'f', '♂': 'm', '♥': '<3',
    '♾': 'oo', '⚡': 'z', '✅': '[x]', '✓': 'v', '✔': 'v', '❌': 'x',
    '❤': '<3', '➡': '->', '⟶': '->', '⨁': '+', '⭐': '*', '⭕': 'O',
    '、': ',', '。': '.', '《': '<', '》': '>', 'Ç': 'C', 'ò': 'o',
    'ù': 'u', 'û': 'u', 'ę': 'e', 'ȃ': 'a', '̀': "'", 'ό': 'o',
    'ỳ': 'y', '\u2009': ' ', '\u202f': ' '
};

const _russianTranslitLower = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d",
    "е": "je", "ё": "jo", "ж": "zh", "з": "z", "и": "i",
    "й": "ji", "к": "k", "л": "l", "м": "m", "н": "n",
    "о": "o", "п": "p", "р": "r", "с": "s", "т": "t",
    "у": "u", "ф": "f", "х": "kh", "ц": "c", "ч": "ch",
    "ш": "sh", "щ": "xh", "ъ": "qh", "ы": "yh", "ь": "jh",
    "э": "e", "ю": "uh", "я": "ja",
};

const russianTransliteration = { ..._russianTranslitLower };
for (const [k, v] of Object.entries(_russianTranslitLower)) {
    russianTransliteration[k.toUpperCase()] = v.charAt(0).toUpperCase() + v.slice(1);
}

function encodeUnknownChar(char) {
    return `[\\u${char.codePointAt(0).toString(16).padStart(4, '0')}]`;
}

function encodeUnknownChars(text, knownChars) {
    let result = "";
    for (const char of text) {
        result += knownChars.has(char) ? char : encodeUnknownChar(char);
    }
    return result;
}

function isFontSupportsRussian(chars) {
    return "а" in chars;
}

function transliterateRussian(text) {
    for (const [k, v] of Object.entries(russianTransliteration)) {
        text = text.split(k).join(v);
    }
    return text;
}

const subscriptMap = {
    '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
    '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
};

// UI Elements
const els = {
    input: document.getElementById('inputText'),
    gridSize: document.getElementById('gridSize'),
    scale: document.getElementById('scale'),
    marginMm: document.getElementById('marginMm'),
    dpi: document.getElementById('dpi'),
    lineGap: document.getElementById('lineGap'),
    compactMode: document.getElementById('compactMode'),
    extremeMode: document.getElementById('extremeMode'),
    includeLegend: document.getElementById('includeLegend'),
    transliterate: document.getElementById('transliterate'),
    addBorders: document.getElementById('addBorders'),
    includePageNumbers: document.getElementById('includePageNumbers'),
    saveAsPdf: document.getElementById('saveAsPdf'),
    includeHeader: document.getElementById('includeHeader'),
    headerText: document.getElementById('headerText'),
    headerTextGroup: document.getElementById('headerTextGroup'),
    downloadBtn: document.getElementById('downloadBtn'),
    fileInput: document.getElementById('fileInput'),
    uploadBtn: document.getElementById('uploadBtn'),
    processFileBtn: document.getElementById('processFileBtn'),
    container: document.getElementById('canvasContainer'),
    loading: document.getElementById('loadingOverlay'),
    pagesIndicator: document.getElementById('pagesIndicator'),
    previewHeaderStatus: document.getElementById('previewHeaderStatus'),
    previewTitle: document.getElementById('previewTitle'),
    previewProgress: document.getElementById('previewProgress'),
    previewProgressBar: document.getElementById('previewProgressBar'),
    previewProgressText: document.getElementById('previewProgressText')
};

// State
let fontsCache = {
    '5x5': null,
    '5x4': null,
    '4x3': null
};
let legendText = "";
let renderTimeout = null;
let currentCanvases = [];
let selectedFile = null;

function parseCsvLine(line) {
    const fields = [];
    let pos = 0;
    while (pos < line.length) {
        if (line[pos] === '"') {
            let value = '';
            pos++;
            while (pos < line.length) {
                if (line[pos] === '"' && pos + 1 < line.length && line[pos + 1] === '"') {
                    value += '"';
                    pos += 2;
                } else if (line[pos] === '"') {
                    pos++;
                    break;
                } else {
                    value += line[pos];
                    pos++;
                }
            }
            fields.push(value);
            if (pos < line.length && line[pos] === ',') pos++;
        } else {
            const nextComma = line.indexOf(',', pos);
            if (nextComma === -1) {
                fields.push(line.substring(pos));
                break;
            }
            fields.push(line.substring(pos, nextComma));
            pos = nextComma + 1;
            if (pos === line.length) fields.push('');
        }
    }
    return fields;
}

// Parse CSV definitions
function parseCsv(csvText) {
    const chars = {};
    const lines = csvText.split('\n').map(parseCsvLine);
    let currChar = null;
    let currGrid = [];

    for (const row of lines) {
        if (!row.length || (row.length === 1 && !row[0])) continue;

        if (row[0]) {
            if (currChar !== null) {
                chars[currChar] = currGrid;
            }
            currChar = row[0];
            currGrid = [];
        } else {
            if (row.length > 1) {
                currGrid.push(row.slice(1));
            } else {
                currGrid.push(["", "", "", "", ""]);
            }
        }
    }
    if (currChar !== null) {
        chars[currChar] = currGrid;
    }
    return chars;
}

// Fetch files
async function fetchFont(size) {
    if (fontsCache[size]) return fontsCache[size];

    const fileName = `Times_Sitelew_Roman_${size}_pixels.csv`;
    try {
        const response = await fetch(`definitions/${fileName}`);
        if (!response.ok) throw new Error(`HTTP error ${response.status}`);
        const text = await response.text();
        fontsCache[size] = parseCsv(text);
        return fontsCache[size];
    } catch (err) {
        console.error("Failed to fetch font CSV. If you are running locally via file://, CORS might block this.", err);
        alert(`Failed to load font definitions for ${size}. Please run a local web server (e.g. python -m http.server).`);
        return {};
    }
}

async function fetchLegend() {
    if (legendText) return legendText;
    try {
        const response = await fetch('character_legend.txt');
        if (response.ok) {
            const text = await response.text();
            legendText = text.replace(/\s+/g, ' ').trim();
        }
    } catch (err) {
        console.warn("Could not fetch character_legend.txt", err);
    }
    return legendText;
}

function getCharWidth(grid, maxCols) {
    if (!grid || !grid.length) return 2;
    let maxCol = -1;
    for (const row of grid) {
        for (let cIdx = 0; cIdx < row.length; cIdx++) {
            if (cIdx >= maxCols) break;
            if (row[cIdx].includes("#")) {
                if (cIdx > maxCol) maxCol = cIdx;
            }
        }
    }
    if (maxCol === -1) return 2;
    return (maxCol + 1) + 1; // logical width + 1 px gap
}

function normalizeText(text, isExtreme, isCompact, legend) {
    let t = text;

    if (legend) {
        t = `[[CHARACTERS LEGEND: ${legend} CHARACTERS LEGEND END.]]\n\n` + t;
    }

    t = t.normalize("NFC");

    for (const [k, v] of Object.entries(typographicReplacements)) {
        t = t.split(k).join(v);
    }

    if (isExtreme) {
        t = t.toLowerCase();
    }

    if (isCompact || isExtreme) {
        t = t.replace(/\s+/g, ' ');
    }

    return t;
}

function applySubscriptDigits(text) {
    let t = text;
    for (const [k, v] of Object.entries(subscriptMap)) {
        t = t.split(k).join(v);
    }
    return t;
}

async function startRender() {
    clearTimeout(renderTimeout);
     els.loading.classList.add('active');

    // Use debounce to prevent freezing the UI while typing
    renderTimeout = setTimeout(async () => {
        await renderText();
        els.loading.classList.remove('active');
    }, CONFIG.DEBOUNCE_MS);
}

// Function to yield control to the UI thread
const yieldToMain = () => new Promise(resolve => requestAnimationFrame(resolve));

function splitLineIntoWords(line, isCompact) {
    const words = [];
    let currentWord = "";
    for (const c of line) {
        if (c === ' ') {
            if (currentWord) {
                words.push(currentWord);
                currentWord = "";
            }
            if (isCompact) {
                if (words.length === 0 || words[words.length - 1] !== " ") {
                    words.push(" ");
                }
            } else {
                words.push(" ");
            }
        } else {
            currentWord += c;
        }
    }
    if (currentWord) words.push(currentWord);
    return words;
}

function prepareHeaderText(rawHeader, isExtreme, chars, knownChars) {
    let text = normalizeText(rawHeader, isExtreme, false, "");
    if (els.transliterate.checked) {
        if (!isFontSupportsRussian(chars)) {
            text = transliterateRussian(text);
        }
        text = encodeUnknownChars(text, knownChars);
    }
    if (isExtreme) {
        text = applySubscriptDigits(text);
    }
    return text;
}

const BORDER_MM = {
    OUTER_OFFSET: 2,
    OUTER_THICKNESS: 0.3,
    MIDDLE_OFFSET: 4,
    MIDDLE_THICKNESS: 0.8,
    INNER_OFFSET: 6,
    INNER_THICKNESS: 0.3,
    MIN_MARGIN: 7
};

function mmToPx(mm, dpi) {
    return Math.round((mm / 25.4) * dpi);
}

function strokeBorderRect(ctx, offset, thickness, widthPx, heightPx) {
    ctx.lineWidth = thickness;
    ctx.strokeRect(
        offset + thickness / 2,
        offset + thickness / 2,
        widthPx - 2 * offset - thickness,
        heightPx - 2 * offset - thickness
    );
}

function drawPageBorders(ctx, widthPx, heightPx, dpi) {
    ctx.save();
    ctx.strokeStyle = "black";

    strokeBorderRect(ctx, mmToPx(BORDER_MM.OUTER_OFFSET, dpi), mmToPx(BORDER_MM.OUTER_THICKNESS, dpi), widthPx, heightPx);
    strokeBorderRect(ctx, mmToPx(BORDER_MM.MIDDLE_OFFSET, dpi), mmToPx(BORDER_MM.MIDDLE_THICKNESS, dpi), widthPx, heightPx);
    strokeBorderRect(ctx, mmToPx(BORDER_MM.INNER_OFFSET, dpi), mmToPx(BORDER_MM.INNER_THICKNESS, dpi), widthPx, heightPx);

    ctx.restore();
}

function drawBordersOnAllPages(dpi, marginMm) {
    if (!els.addBorders.checked) return;
    if (marginMm < BORDER_MM.MIN_MARGIN) return;
    if (currentCanvases.length === 0) return;

    const widthPx = currentCanvases[0].width;
    const heightPx = currentCanvases[0].height;
    for (const canvas of currentCanvases) {
        drawPageBorders(canvas.getContext('2d'), widthPx, heightPx, dpi);
    }
}

async function renderText(customText = null, showProgress = false) {
    const rawText = customText !== null ? customText : els.input.value;
    if (!rawText.trim() && !els.includeLegend.checked && !els.includeHeader.checked) {
        els.container.innerHTML = '';
        currentCanvases = [];
        return;
    }

    const size = els.gridSize.value;
    const isExtreme = els.extremeMode.checked;
    const isCompact = els.compactMode.checked || isExtreme;
    const wantsLegend = els.includeLegend.checked;
    const scale = parseInt(els.scale.value) || CONFIG.DEFAULT_SCALE;
    const dpi = parseInt(els.dpi.value) || CONFIG.DEFAULT_DPI;
    const marginMm = parseInt(els.marginMm.value) || CONFIG.DEFAULT_MARGIN_MM;
    let lineGap = parseInt(els.lineGap.value) || 0;

    if (isExtreme) {
        lineGap = 0;
    }

    const maxRows = size === "4x3" ? 4 : 5;
    const maxCols = size === "4x3" ? 3 : (size === "5x4" ? 4 : 5);
    const spaceWidth = size === "4x3" ? 2 : 3;

    const chars = await fetchFont(size);
    const knownChars = new Set([...Object.keys(chars), ' ', '\n']);

    let legend = "";
    if (wantsLegend) {
        legend = await fetchLegend();
    }

    let text = normalizeText(rawText, isExtreme, isCompact, legend);

    if (els.transliterate.checked) {
        if (!isFontSupportsRussian(chars)) {
            text = transliterateRussian(text);
        }
        text = encodeUnknownChars(text, knownChars);
    }

    let cleanText = text;

    if (isExtreme) {
        cleanText = applySubscriptDigits(cleanText);
    }

    const widthPx = Math.floor((210 / 25.4) * dpi);
    const heightPx = Math.floor((297 / 25.4) * dpi);
    const marginPx = Math.floor((marginMm / 25.4) * dpi);

    els.container.innerHTML = '';
    currentCanvases = [];

    let ctx, canvas;
    const createNewCanvas = () => {
        canvas = document.createElement('canvas');
        canvas.width = widthPx;
        canvas.height = heightPx;
        ctx = canvas.getContext('2d');
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, widthPx, heightPx);
        ctx.fillStyle = "black";
        els.container.appendChild(canvas);
        currentCanvases.push(canvas);
        return { ctx, canvas };
    };

    createNewCanvas();
    els.pagesIndicator.textContent = `Page 1`;

    let x = marginPx;
    let y = marginPx;
    const lineHeight = maxRows;

    const getWordWidthAt = (word, blockScale) => {
        let w = 0;
        for (const c of word) {
            if (c === ' ') {
                w += spaceWidth;
                continue;
            }
            const grid = chars[c] || chars['.notdef'] || [];
            w += getCharWidth(grid, maxCols);
        }
        return w * blockScale;
    };

    const drawCharAt = (grid, cx, cy, blockScale) => {
        if (!grid) return;
        ctx.fillStyle = "black";
        for (let rIdx = 0; rIdx < grid.length; rIdx++) {
            if (rIdx >= maxRows) break;
            const row = grid[rIdx];
            for (let cIdx = 0; cIdx < row.length; cIdx++) {
                if (cIdx >= maxCols) break;
                if (row[cIdx].includes("#")) {
                    const px = cx + cIdx * blockScale;
                    const py = cy + rIdx * blockScale;
                    ctx.fillRect(px, py, blockScale, blockScale);
                }
            }
        }
    };

    let totalPages = 1;
    let charCount = 0;
    let lastYieldTime = Date.now();

    const renderBlock = async (blockText, blockScale, blockCompact, blockLineGap) => {
        const blockLines = blockCompact ? [blockText] : blockText.split('\n');

        for (const line of blockLines) {
            const words = splitLineIntoWords(line, blockCompact);

            for (const word of words) {
                const wordWidth = getWordWidthAt(word, blockScale);
                if (word === " " && x === marginPx) {
                    charCount += word.length;
                    continue;
                }

                if (x + wordWidth > widthPx - marginPx) {
                    if (word === " ") {
                        charCount += word.length;
                        continue;
                    }
                    x = marginPx;
                    y += (lineHeight + blockLineGap) * blockScale;
                    if (y > heightPx - marginPx) {
                        createNewCanvas();
                        totalPages++;
                        x = marginPx;
                        y = marginPx;
                    }
                }

                if (word === " ") {
                    x += spaceWidth * blockScale;
                } else {
                    for (const c of word) {
                        const grid = chars[c] || chars['.notdef'] || [];
                        const cw = getCharWidth(grid, maxCols);
                        const charPxWidth = cw * blockScale;
                        if (x + charPxWidth > widthPx - marginPx && x > marginPx) {
                            x = marginPx;
                            y += (lineHeight + blockLineGap) * blockScale;
                            if (y > heightPx - marginPx) {
                                createNewCanvas();
                                totalPages++;
                                x = marginPx;
                                y = marginPx;
                            }
                        }
                        drawCharAt(grid, x, y, blockScale);
                        x += charPxWidth;
                    }
                }

                charCount += word.length;

                if (showProgress && Date.now() - lastYieldTime > 50) {
                    const percent = Math.round((charCount / totalChars) * 100);
                    updatePreviewProgress(percent, `Processing: ${percent}% (Page ${totalPages})`);
                    await yieldToMain();
                    lastYieldTime = Date.now();
                }
            }

            x = marginPx;
            y += (lineHeight + blockLineGap) * blockScale;
            if (y > heightPx - marginPx) {
                createNewCanvas();
                totalPages++;
                x = marginPx;
                y = marginPx;
            }

            if (!blockCompact) charCount++;
        }
    };

    let headerCleanText = "";
    if (els.includeHeader.checked) {
        headerCleanText = prepareHeaderText(els.headerText.value, isExtreme, chars, knownChars);
    }

    const totalChars = cleanText.length + headerCleanText.length;

    if (headerCleanText) {
        await renderBlock(headerCleanText, scale * CONFIG.HEADER_SCALE_MULTIPLIER, false, lineGap);
    }

    await renderBlock(cleanText, scale, isCompact, lineGap);

    drawBordersOnAllPages(dpi, marginMm);

    // Render Page Numbers
    if (els.includePageNumbers.checked) {
        const pnScale = scale * CONFIG.HEADER_SCALE_MULTIPLIER;
        const padding = Math.max(2, Math.floor(pnScale / 2));
        
        // Align to the outer border (2mm from edge)
        const outerBorderOffset = mmToPx(2, dpi);
        
        for (let i = 0; i < currentCanvases.length; i++) {
            const canvas = currentCanvases[i];
            const ctx = canvas.getContext('2d');
            const pageNumText = `${i + 1}/${totalPages}`;
            
            // Calculate text width
            let textWidth = 0;
            for (const c of pageNumText) {
                if (c === ' ') {
                    textWidth += spaceWidth * pnScale;
                } else {
                    const grid = chars[c] || chars['.notdef'] || [];
                    textWidth += getCharWidth(grid, maxCols) * pnScale;
                }
            }
            
            const textHeight = maxRows * pnScale;
            const boxWidth = textWidth + padding * 2;
            const boxHeight = textHeight + padding * 2;
            
            // Position: bottom right, aligned to outer border
            const bx = widthPx - outerBorderOffset - boxWidth;
            const by = heightPx - outerBorderOffset - boxHeight;
            
            // Draw Box
            ctx.fillStyle = "white";
            ctx.fillRect(bx, by, boxWidth, boxHeight);
            ctx.lineWidth = Math.max(1, Math.floor(pnScale / 8));
            ctx.strokeStyle = "black";
            ctx.strokeRect(bx, by, boxWidth, boxHeight);
            
            // Draw Text
            let cx = bx + padding;
            const cy = by + padding;
            
            ctx.fillStyle = "black";
            for (const c of pageNumText) {
                if (c === ' ') {
                    cx += spaceWidth * pnScale;
                } else {
                    const grid = chars[c] || chars['.notdef'] || [];
                    // Draw char grid
                    for (let rIdx = 0; rIdx < grid.length; rIdx++) {
                        if (rIdx >= maxRows) break;
                        const row = grid[rIdx];
                        for (let cIdx = 0; cIdx < row.length; cIdx++) {
                            if (cIdx >= maxCols) break;
                            if (row[cIdx].includes("#")) {
                                ctx.fillRect(cx + cIdx * pnScale, cy + rIdx * pnScale, pnScale, pnScale);
                            }
                        }
                    }
                    cx += getCharWidth(grid, maxCols) * pnScale;
                }
            }
        }
    }

    if (showProgress) {
        updatePreviewProgress(100, `Processing Complete! (Total Pages: ${totalPages})`);
    }

    els.pagesIndicator.textContent = `Page 1 of ${totalPages}`;
}

function handleDownloadPng(baseName) {
    currentCanvases.forEach((canvas, index) => {
        const url = canvas.toDataURL("image/png");
        const a = document.createElement('a');
        a.href = url;
        const suffix = currentCanvases.length > 1 ? `_page${index + 1}` : '';
        a.download = `${baseName}${suffix}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    });
}

function updatePreviewProgress(percent, text) {
    if (percent === null) {
        if (els.saveAsPdf.checked) {
            els.previewTitle.textContent = "⚠️ PDF option enabled. Can be very slow";
            els.previewTitle.style.color = "var(--accent-color)";
        } else {
            els.previewTitle.textContent = "Live Preview";
            els.previewTitle.style.color = "";
        }
        els.previewTitle.style.display = 'block';
        els.previewProgress.style.display = 'none';
    } else {
        els.previewTitle.style.display = 'none';
        els.previewProgress.style.display = 'block';
        els.previewProgressBar.style.width = `${percent}%`;
        els.previewProgressText.textContent = text;
    }
}

// Utility to wrap canvas.toBlob in a Promise
function canvasToBlobAsync(canvas, type, quality) {
    return new Promise(resolve => {
        canvas.toBlob(resolve, type, quality);
    });
}

async function handleDownloadPdf(baseName) {
    if (!window.PDFLib) {
        throw new Error("pdf-lib library is not loaded. Please check your internet connection and try again.");
    }
    const { PDFDocument } = window.PDFLib;
    const doc = await PDFDocument.create();
    const total = currentCanvases.length;

    updatePreviewProgress(0, `Generating PDF: preparing ${total} pages...`);
    await yieldToMain();

    for (let i = 0; i < total; i++) {
        updatePreviewProgress(Math.round((i / total) * 100), `Generating PDF: encoding page ${i + 1} of ${total}...`);
        await yieldToMain();
        
        // Since it's a black and white pixel font, PNG is flawlessly lossless and compresses incredibly well.
        // We async-extract it as a blob so we don't freeze the main thread.
        const blob = await canvasToBlobAsync(currentCanvases[i], 'image/png');
        const arrayBuffer = await blob.arrayBuffer();

        updatePreviewProgress(Math.round(((i + 0.5) / total) * 100), `Generating PDF: embedding page ${i + 1} of ${total}...`);
        await yieldToMain();
        
        // pdf-lib embeds PNG directly without inflating its pixels into memory, 
        // which completely bypasses the 130MB per-page scaling RAM crash
        const pngImage = await doc.embedPng(arrayBuffer);
        
        // A4 is 210x297 mm, which is 595.28 x 841.89 points
        const page = doc.addPage([595.28, 841.89]);
        page.drawImage(pngImage, {
            x: 0,
            y: 0,
            width: 595.28,
            height: 841.89,
        });

        updatePreviewProgress(Math.round(((i + 1) / total) * 100), `Generating PDF: page ${i + 1} of ${total} done.`);
    }

    updatePreviewProgress(100, `Building final PDF (${total} pages)...`);
    await yieldToMain();
    
    // Save to byte array
    const pdfBytes = await doc.save();
    
    updatePreviewProgress(100, `Saving PDF file...`);
    await yieldToMain();

    // Trigger download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${baseName}.pdf`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    updatePreviewProgress(100, `PDF saved! (${total} pages)`);
    setTimeout(() => updatePreviewProgress(null), 3000);
}

async function handleDownload(baseName = "rendered_text") {
    if (currentCanvases.length === 0) {
        alert("Nothing to download.");
        return;
    }

    try {
        if (els.saveAsPdf.checked) {
            await handleDownloadPdf(baseName);
        } else {
            handleDownloadPng(baseName);
        }
    } catch (err) {
        console.error("Download failed:", err);
        updatePreviewProgress(null);
        alert(`Error generating download: ${err.message}`);
    }
}

// File Processing logic
els.uploadBtn.addEventListener('click', () => els.fileInput.click());

els.fileInput.addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    if (selectedFile) {
        els.uploadBtn.textContent = selectedFile.name;
        els.processFileBtn.disabled = false;
        els.processFileBtn.style.display = 'flex';
        els.headerText.value = `${CONFIG.DEFAULT_HEADER_TEXT} ${selectedFile.name}`;
    } else {
        els.uploadBtn.textContent = 'Choose .txt File...';
        els.processFileBtn.disabled = true;
        els.processFileBtn.style.display = 'none';
        els.headerText.value = CONFIG.DEFAULT_HEADER_TEXT;
    }
    startRender();
});

els.processFileBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    els.loading.classList.add('active');
    els.processFileBtn.disabled = true;
    els.processFileBtn.textContent = "Processing...";
    updatePreviewProgress(0, 'Reading file...');

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        updatePreviewProgress(0, 'Rendering text into pages...');
        await yieldToMain();
        await renderText(text, true);

        const base = selectedFile.name.replace(/\.[^/.]+$/, "");
        await handleDownload(base);

        els.loading.classList.remove('active');
        els.processFileBtn.disabled = false;
        els.processFileBtn.textContent = "Process & Download";
        setTimeout(() => updatePreviewProgress(null), 3000);
    };
    reader.readAsText(selectedFile);
});

// Event Listeners
const triggers = ['input', 'gridSize', 'scale', 'marginMm', 'dpi', 'lineGap', 'compactMode', 'extremeMode', 'includeLegend', 'transliterate', 'includeHeader', 'addBorders', 'includePageNumbers'];
triggers.forEach(id => {
    els[id].addEventListener(id === 'input' ? 'input' : 'change', startRender);
});

els.includeHeader.addEventListener('change', (e) => {
    els.headerTextGroup.style.display = e.target.checked ? 'block' : 'none';
});

els.headerText.addEventListener('input', startRender);

els.extremeMode.addEventListener('change', (e) => {
    if (e.target.checked) {
        els.compactMode.checked = true;
        els.lineGap.value = 0;
        els.lineGap.disabled = true;
    } else {
        els.lineGap.disabled = false;
    }
});

els.downloadBtn.addEventListener('click', () => handleDownload());

// Initial Render attempt (fetches CSVs)
setTimeout(() => {
    // If input is empty, maybe don't fully render but warm up caches
    fetchFont(els.gridSize.value);

    // Initial state check
    if (els.extremeMode.checked) {
        els.lineGap.disabled = true;
    }

    // Set defaults from config (overrides HTML hardcoded values)
    if (!els.headerText.value) els.headerText.value = CONFIG.DEFAULT_HEADER_TEXT;
    
    startRender();
}, 100);
