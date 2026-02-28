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
    downloadBtn: document.getElementById('downloadBtn'),
    fileInput: document.getElementById('fileInput'),
    uploadBtn: document.getElementById('uploadBtn'),
    processFileBtn: document.getElementById('processFileBtn'),
    container: document.getElementById('canvasContainer'),
    loading: document.getElementById('loadingOverlay'),
    pagesIndicator: document.getElementById('pagesIndicator'),
    progressContainer: document.getElementById('progressContainer'),
    progressBar: document.getElementById('progressBar'),
    progressText: document.getElementById('progressText')
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

    // Typographic replacements
    for (const [k, v] of Object.entries(typographicReplacements)) {
        t = t.split(k).join(v);
    }

    if (isExtreme) {
        t = t.toLowerCase();
        for (const [k, v] of Object.entries(subscriptMap)) {
            t = t.split(k).join(v);
        }
    }

    if (isCompact || isExtreme) {
        t = t.replace(/\s+/g, ' ');
    }

    return t;
}

async function startRender() {
    clearTimeout(renderTimeout);
    els.loading.classList.add('active');

    // Hide progress during live typing for cleaner UI
    els.progressContainer.style.display = 'none';

    // Use debounce to prevent freezing the UI while typing
    renderTimeout = setTimeout(async () => {
        await renderText();
        els.loading.classList.remove('active');
    }, 300);
}

// Function to yield control to the UI thread
const yieldToMain = () => new Promise(resolve => requestAnimationFrame(resolve));

async function renderText(customText = null, showProgress = false) {
    const rawText = customText !== null ? customText : els.input.value;
    if (!rawText.trim() && !els.includeLegend.checked) {
        els.container.innerHTML = '';
        currentCanvases = [];
        return;
    }

    const size = els.gridSize.value;
    const isExtreme = els.extremeMode.checked;
    const isCompact = els.compactMode.checked || isExtreme;
    const wantsLegend = els.includeLegend.checked;
    const scale = parseInt(els.scale.value) || 2;
    const dpi = parseInt(els.dpi.value) || 300;
    const marginMm = parseInt(els.marginMm.value) || 10;
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

    // Handle unknown chars
    let cleanText = "";
    for (const char of text) {
        cleanText += knownChars.has(char) ? char : '\uFFFD';
    }
    if (isCompact) {
        cleanText = cleanText.replace(/\uFFFD+/g, '\uFFFD');
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

    const getWordWidth = (word) => {
        let w = 0;
        for (const c of word) {
            if (c === ' ') {
                w += spaceWidth;
                continue;
            }
            const grid = chars[c] || chars['.notdef'] || [];
            w += getCharWidth(grid, maxCols);
        }
        return w * scale;
    };

    const drawChar = (grid, cx, cy) => {
        if (!grid) return;
        ctx.fillStyle = "black";
        for (let rIdx = 0; rIdx < grid.length; rIdx++) {
            if (rIdx >= maxRows) break;
            const row = grid[rIdx];
            for (let cIdx = 0; cIdx < row.length; cIdx++) {
                if (cIdx >= maxCols) break;
                if (row[cIdx].includes("#")) {
                    const px = cx + cIdx * scale;
                    const py = cy + rIdx * scale;
                    ctx.fillRect(px, py, scale, scale);
                }
            }
        }
    };

    let lines = isCompact ? [cleanText] : cleanText.split('\n');
    let totalPages = 1;

    // Progress calculation for file processing
    let charCount = 0;
    const totalChars = cleanText.length;
    let lastYieldTime = Date.now();

    for (const line of lines) {
        let words = [];
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

        for (const word of words) {
            const wordWidth = getWordWidth(word);
            if (word === " " && x === marginPx) {
                charCount += word.length;
                continue;
            }

            if (x + wordWidth > widthPx - marginPx) {
                if (word === " ") {
                    charCount += word.length;
                    continue;
                }
                // Wrap
                x = marginPx;
                y += (lineHeight + lineGap) * scale;
                if (y > heightPx - marginPx) {
                    createNewCanvas();
                    totalPages++;
                    x = marginPx;
                    y = marginPx;
                }
            }

            if (word === " ") {
                x += spaceWidth * scale;
            } else {
                for (const c of word) {
                    const grid = chars[c] || chars['.notdef'] || [];
                    const cw = getCharWidth(grid, maxCols);
                    drawChar(grid, x, y);
                    x += cw * scale;
                }
            }

            charCount += word.length;

            // Yield to UI thread and update progress if processing a file
            if (showProgress && Date.now() - lastYieldTime > 50) {
                const percent = Math.round((charCount / totalChars) * 100);
                els.progressBar.style.width = `${percent}%`;
                els.progressText.textContent = `Processing: ${percent}% (Page ${totalPages})`;
                await yieldToMain();
                lastYieldTime = Date.now();
            }
        }

        // Explicit newline mapping
        x = marginPx;
        y += (lineHeight + lineGap) * scale;
        if (y > heightPx - marginPx) {
            createNewCanvas();
            totalPages++;
            x = marginPx;
            y = marginPx;
        }

        // Add character for newline in progress calculation
        if (!isCompact) charCount++;
    }

    if (showProgress) {
        els.progressBar.style.width = '100%';
        els.progressText.textContent = `Processing Complete! (Total Pages: ${totalPages})`;
    }

    els.pagesIndicator.textContent = `Page 1 of ${totalPages}`;
}

function handleDownload(baseName = "rendered_text") {
    if (currentCanvases.length === 0) {
        alert("Nothing to download.");
        return;
    }

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

// File Processing logic
els.uploadBtn.addEventListener('click', () => els.fileInput.click());

els.fileInput.addEventListener('change', (e) => {
    selectedFile = e.target.files[0];
    if (selectedFile) {
        els.uploadBtn.textContent = selectedFile.name;
        els.processFileBtn.disabled = false;
        els.progressContainer.style.display = 'none';
        els.progressBar.style.width = '0%';
    } else {
        els.uploadBtn.textContent = 'Choose .txt File...';
        els.processFileBtn.disabled = true;
    }
});

els.processFileBtn.addEventListener('click', async () => {
    if (!selectedFile) return;

    els.loading.classList.add('active');
    els.processFileBtn.disabled = true;
    els.processFileBtn.textContent = "Processing...";
    els.progressContainer.style.display = 'block';

    const reader = new FileReader();
    reader.onload = async (e) => {
        const text = e.target.result;
        await renderText(text, true);

        const base = selectedFile.name.replace(/\.[^/.]+$/, "");
        handleDownload(base);

        els.loading.classList.remove('active');
        els.processFileBtn.disabled = false;
        els.processFileBtn.textContent = "Process & Download";
    };
    reader.readAsText(selectedFile);
});

// Event Listeners
const triggers = ['input', 'gridSize', 'scale', 'marginMm', 'dpi', 'lineGap', 'compactMode', 'extremeMode', 'includeLegend'];
triggers.forEach(id => {
    els[id].addEventListener(id === 'input' ? 'input' : 'change', startRender);
});

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

    startRender();
}, 100);
