import argparse
import csv
from PIL import Image, ImageDraw
import sys

_RUSSIAN_TRANSLITERATION_LOWER = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d",
    "е": "je", "ё": "jo", "ж": "zh", "з": "z", "и": "i",
    "й": "ji", "к": "k", "л": "l", "м": "m", "н": "n",
    "о": "o", "п": "p", "р": "r", "с": "s", "т": "t",
    "у": "u", "ф": "f", "х": "kh", "ц": "c", "ч": "ch",
    "ш": "sh", "щ": "xh", "ъ": "qh", "ы": "yh", "ь": "jh",
    "э": "e", "ю": "uh", "я": "ja",
}

RUSSIAN_TRANSLITERATION = {
    **_RUSSIAN_TRANSLITERATION_LOWER,
    **{k.upper(): v.capitalize() for k, v in _RUSSIAN_TRANSLITERATION_LOWER.items()},
}


def is_font_supports_russian(chars):
    return "а" in chars


def transliterate_russian(text):
    for k, v in RUSSIAN_TRANSLITERATION.items():
        text = text.replace(k, v)
    return text


def encode_unknown_char(char):
    return f"[\\u{ord(char):04x}]"


def encode_unknown_chars(text, known_chars):
    result = []
    for c in text:
        if c in known_chars:
            result.append(c)
        else:
            result.append(encode_unknown_char(c))
    return "".join(result)

def parse_csv(csv_path):
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            lines = list(reader)
    except Exception as e:
        print(f"Error reading {csv_path}: {e}")
        sys.exit(1)

    chars = {}
    curr_char = None
    curr_grid = []
    for row in lines:
        if not row:
            continue
        if row[0]:
            if curr_char is not None:
                chars[curr_char] = curr_grid
            curr_char = row[0]
            curr_grid = []
        else:
            if len(row) > 1:
                curr_grid.append(row[1:])
            else:
                curr_grid.append([""] * 5)
                
    if curr_char is not None:
        chars[curr_char] = curr_grid
        
    return chars

def get_char_width(grid, max_cols):
    if not grid:
        return 2 # fallback for empty grid matching build_font
    max_col = -1
    for row in grid:
        for col_idx, cell in enumerate(row):
            if col_idx >= max_cols:
                break
            if "#" in cell:
                if col_idx > max_col:
                    max_col = col_idx
    
    if max_col == -1:
        return 2 # fallback for empty grid that shouldn't be space, same as build_font.py logic
        
    return (max_col + 1) + 1 # actual pixels + 1 pixel gap

def draw_char(draw, grid, x, y, max_rows, max_cols, scale):
    if not grid:
        return
    for r_idx, row in enumerate(grid):
        if r_idx >= max_rows:
            break
        for c_idx, cell in enumerate(row):
            if c_idx >= max_cols:
                break
            if "#" in cell:
                px = x + c_idx * scale
                py = y + r_idx * scale
                # draw a rectangle for the pixel (scaled)
                draw.rectangle([px, py, px + scale - 1, py + scale - 1], fill=0)

def main():
    parser = argparse.ArgumentParser(description="Render text into a pixel-precise A4 image.")
    parser.add_argument("--text", required=True, help="Input text file")
    parser.add_argument("--out", default="output.png", help="Output PNG file")
    parser.add_argument("--dpi", type=int, default=300, help="Printing resolution (DPI)")
    parser.add_argument("--font-csv", default=None, help="Font CSV file, defaults to the size-appropriate CSV in docs/definitions directory if unspecified.")
    parser.add_argument("--scale", type=int, default=1, help="Scale factor (e.g. 2 means 2x2 pixels per cell)")
    parser.add_argument("--size", choices=["4x3", "5x4", "5x5"], default="5x5", help="Font grid size to use (for max cols/rows)")
    parser.add_argument("--margin-mm", type=int, default=10, help="Margin in mm")
    parser.add_argument("--line-gap", type=int, default=1, help="Gap between lines in pixels")
    parser.add_argument("--compact", action="store_true", help="Compact mode: ignore newlines and continuous spaces to save space")
    parser.add_argument("--extreme", action="store_true", help="Extreme mode: assumes compact, converts to lowercase, converts digits to subscripts, and sets line-gap to 1 (between letters, basically overlapping lines for max density)")
    parser.add_argument("--include_legend", default=True, type=lambda x: (str(x).lower() in ['true', '1', 'yes']), help="Include legend text character_legend.txt at the start of output (default: True)")
    parser.add_argument("--no-legend", action="store_false", dest="include_legend", help="Disable the inclusion of character_legend.txt at the start of output")
    parser.add_argument("--transliterate", default=True, type=lambda x: (str(x).lower() in ['true', '1', 'yes']), help="Convert unsupported characters to Latin equivalents. Russian uses a reversible transliteration; other scripts are encoded as hex codes like [\\u0436] (default: True)")
    parser.add_argument("--no-transliterate", action="store_false", dest="transliterate", help="Disable transliteration of unsupported characters")
    args = parser.parse_args()

    if args.font_csv is None:
        import os
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        if args.size == "4x3":
            args.font_csv = os.path.join(base_dir, "docs", "definitions", "Times_Sitelew_Roman_4x3_pixels.csv")
        elif args.size == "5x5":
            args.font_csv = os.path.join(base_dir, "docs", "definitions", "Times_Sitelew_Roman_5x5_pixels.csv")
        else:
            args.font_csv = os.path.join(base_dir, "docs", "definitions", "Times_Sitelew_Roman_5x4_pixels.csv")

    if args.extreme:
        args.compact = True
        # Lowercase letters typically occupy rows 1 to 4 (4 pixels tall, row 0 is empty).
        # To leave exactly 1 pixel between them, we need y to advance by 5 pixels.
        # Since max_rows is 5, line_gap = 0 will result in exactly 5 pixels per line, leaving 1 empty pixel.
        args.line_gap = 0

    try:
        with open(args.text, 'r', encoding='utf-8') as f:
            text = f.read()
    except Exception as e:
        print(f"Error reading {args.text}: {e}")
        sys.exit(1)

    if args.include_legend:
        try:
            import os
            legend_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "character_legend.txt")
            with open(legend_path, 'r', encoding='utf-8') as f:
                legend_text = f.read()
            import re
            legend_compact = re.sub(r'\s+', ' ', legend_text).strip()
            text = "[[CHARACTERS LEGEND: " + legend_compact + " CHARACTERS LEGEND END.]]\n\n" + text
        except Exception as e:
            print(f"Warning: Could not read character_legend.txt: {e}")

    # Normalize typographic characters
    typographic_replacements = {
        '—': '-',    # Em dash
        '–': '-',    # En dash
        '“': '"',    # Left double quotation mark
        '”': '"',    # Right double quotation mark
        '„': '"',    # Double low-9 quotation mark
        '«': '"',    # Left-pointing double angle quotation mark
        '»': '"',    # Right-pointing double angle quotation mark
        '‘': "'",    # Left single quotation mark
        '’': "'",    # Right single quotation mark
        '‚': "'",    # Single low-9 quotation mark
        '‹': "'",    # Single left-pointing angle quotation mark
        '›': "'",    # Single right-pointing angle quotation mark
        '…': '...',  # Horizontal ellipsis
        '. . . .': '....', # Spaced 4-dot ellipsis
        '. . .': '...', # Spaced horizontal ellipsis
        '´': "'",    # Acute accent (often used as apostrophe)
        '\t': '    ', # Tab character to 4 spaces
        'À': 'A',     # LATIN CAPITAL LETTER A WITH GRAVE
        'Æ': 'AE',    # LATIN CAPITAL LETTER AE
        'à': 'a',     # LATIN SMALL LETTER A WITH GRAVE
        'â': 'a',     # LATIN SMALL LETTER A WITH CIRCUMFLEX
        'æ': 'ae',    # LATIN SMALL LETTER AE
        'ç': 'c',     # LATIN SMALL LETTER C WITH CEDILLA
        'è': 'e',     # LATIN SMALL LETTER E WITH GRAVE
        'ê': 'e',     # LATIN SMALL LETTER E WITH CIRCUMFLEX
        'ë': 'e',     # LATIN SMALL LETTER E WITH DIAERESIS
        'î': 'i',     # LATIN SMALL LETTER I WITH CIRCUMFLEX
        'ï': 'i',     # LATIN SMALL LETTER I WITH DIAERESIS
        'ô': 'o',     # LATIN SMALL LETTER O WITH CIRCUMFLEX
        'ý': 'y',     # LATIN SMALL LETTER Y WITH ACUTE
        'œ': 'oe',    # LATIN SMALL LIGATURE OE
        'ű': 'u',     # LATIN SMALL LETTER U WITH DOUBLE ACUTE
        '\u2007': ' ',# FIGURE SPACE
        '•': '-',     # BULLET
        '↑': '^',     # UPWARDS ARROW
        '∗': '*',     # ASTERISK OPERATOR
        '⋅': '.',     # DOT OPERATOR
        '\xa0': ' ',  # NO-BREAK SPACE
        '§': 'S',     # SECTION SIGN -> S 
        '¨': '"',     # DIAERESIS -> Quotes 
        '©': '(c)',   # COPYRIGHT SIGN
        '\xad': '-',  # SOFT HYPHEN
        '®': '(r)',   # REGISTERED SIGN
        '°': '*',     # DEGREE SIGN
        '±': '+-',    # PLUS-MINUS SIGN
        '²': '2',     # SUPERSCRIPT TWO
        '³': '3',     # SUPERSCRIPT THREE
        '·': '.',     # MIDDLE DOT
        '¹': '1',     # SUPERSCRIPT ONE
        'º': 'o',     # MASCULINE ORDINAL INDICATOR
        '¼': '1/4',   # VULGAR FRACTION ONE QUARTER
        '×': 'x',     # MULTIPLICATION SIGN
        'å': 'a',     # LATIN SMALL LETTER A WITH RING ABOVE
        '÷': '/',     # DIVISION SIGN
        'ā': 'a',     # LATIN SMALL LETTER A WITH MACRON
        'Ć': 'C',     # LATIN CAPITAL LETTER C WITH ACUTE
        'ć': 'c',     # LATIN SMALL LETTER C WITH ACUTE
        'č': 'c',     # LATIN SMALL LETTER C WITH CARON
        'ĺ': 'l',     # LATIN SMALL LETTER L WITH ACUTE
        'ō': 'o',     # LATIN SMALL LETTER O WITH MACRON
        'Š': 'S',     # LATIN CAPITAL LETTER S WITH CARON
        'š': 's',     # LATIN SMALL LETTER S WITH CARON
        'ž': 'z',     # LATIN SMALL LETTER Z WITH CARON
        'ɓ': 'b',     # LATIN SMALL LETTER B WITH HOOK
        '˜': '~',     # SMALL TILDE
        '́': "'",      # COMBINING ACUTE ACCENT
        '̵': '-',      # COMBINING SHORT STROKE OVERLAY
        'Π': 'P',     # GREEK CAPITAL LETTER PI
        'Σ': 'E',     # GREEK CAPITAL LETTER SIGMA -> E (looks sim)
        'α': 'a',     # GREEK SMALL LETTER ALPHA
        'γ': 'y',     # GREEK SMALL LETTER GAMMA
        'η': 'n',     # GREEK SMALL LETTER ETA
        'π': 'pi',     # GREEK SMALL LETTER PI
        'ρ': 'p',     # GREEK SMALL LETTER RHO
        'χ': 'x',     # GREEK SMALL LETTER CHI
        'І': 'I',     # CYRILLIC CAPITAL LETTER BYELORUSSIAN-UKRAINIAN I
        'і': 'i',     # CYRILLIC SMALL LETTER BYELORUSSIAN-UKRAINIAN I
        'ѣ': 'e',     # CYRILLIC SMALL LETTER YAT
        'ѫ': 'o',     # CYRILLIC SMALL LETTER BIG YUS
        'ᵢ': 'i',     # LATIN SUBSCRIPT SMALL LETTER I
        'ṣ': 's',     # LATIN SMALL LETTER S WITH DOT BELOW
        '\u200b': '', # ZERO WIDTH SPACE
        '\u200d': '', # ZERO WIDTH JOINER
        '‐': '-',     # HYPHEN
        '‑': '-',     # NON-BREAKING HYPHEN
        '―': '-',     # HORIZONTAL BAR
        '\u2061': '', # FUNCTION APPLICATION
        '⁰': '0',     # SUPERSCRIPT ZERO
        '⁴': '4',     # SUPERSCRIPT FOUR
        '⁵': '5',     # SUPERSCRIPT FIVE
        '⁷': '7',     # SUPERSCRIPT SEVEN
        '⁸': '8',     # SUPERSCRIPT EIGHT
        '⁹': '9',     # SUPERSCRIPT NINE
        'ₐ': 'a',     # LATIN SUBSCRIPT SMALL LETTER A
        'ₓ': 'x',     # LATIN SUBSCRIPT SMALL LETTER X
        'ₘ': 'm',     # LATIN SUBSCRIPT SMALL LETTER M
        '€': 'E',     # EURO SIGN
        '⃣': '',      # COMBINING ENCLOSING KEYCAP
        '№': 'No',    # NUMERO SIGN
        '™': 'tm',    # TRADE MARK SIGN
        '⅓': '1/3',   # VULGAR FRACTION ONE THIRD
        '←': '<-',    # LEFTWARDS ARROW
        '→': '->',    # RIGHTWARDS ARROW
        '↔': '<->',   # LEFT RIGHT ARROW
        '⇒': '=>',    # RIGHTWARDS DOUBLE ARROW
        '∆': '^',     # INCREMENT
        '∑': 'E',     # N-ARY SUMMATION
        '−': '-',     # MINUS SIGN
        '√': 'v',     # SQUARE ROOT
        '∞': 'oo',    # INFINITY
        '≈': '~',     # ALMOST EQUAL TO
        '≠': '!=',    # NOT EQUAL TO
        '≤': '<=',    # LESS-THAN OR EQUAL TO
        '≥': '>=',    # GREATER-THAN OR EQUAL TO
        '─': '-',     # BOX DRAWINGS LIGHT HORIZONTAL
        '│': '|',     # BOX DRAWINGS LIGHT VERTICAL
        '└': 'L',     # BOX DRAWINGS LIGHT UP AND RIGHT
        '├': '+',     # BOX DRAWINGS LIGHT VERTICAL AND RIGHT
        '■': '#',     # BLACK SQUARE
        '▪': '-',     # BLACK SMALL SQUARE
        '►': '>',     # BLACK RIGHT-POINTING POINTER
        '○': 'o',     # WHITE CIRCLE
        '●': 'O',     # BLACK CIRCLE
        '◦': 'o',     # WHITE BULLET
        '★': '*',     # BLACK STAR
        '☆': '*',     # WHITE STAR
        '☐': '[]',    # BALLOT BOX
        '☑': '[x]',   # BALLOT BOX WITH CHECK
        '♀': 'f',     # FEMALE SIGN
        '♂': 'm',     # MALE SIGN
        '♥': '<3',    # BLACK HEART SUIT
        '♾': 'oo',    # PERMANENT PAPER SIGN
        '⚡': 'z',     # HIGH VOLTAGE SIGN
        '✅': '[x]',   # WHITE HEAVY CHECK MARK
        '✓': 'v',     # CHECK MARK
        '✔': 'v',     # HEAVY CHECK MARK
        '❌': 'x',     # CROSS MARK
        '❤': '<3',    # HEAVY BLACK HEART
        '➡': '->',    # BLACK RIGHTWARDS ARROW
        '⟶': '->',    # LONG RIGHTWARDS ARROW
        '⨁': '+',     # N-ARY CIRCLED PLUS OPERATOR
        '⭐': '*',     # WHITE MEDIUM STAR
        '⭕': 'O',     # HEAVY LARGE CIRCLE
        '、': ',',     # IDEOGRAPHIC COMMA
        '。': '.',     # IDEOGRAPHIC FULL STOP
        '《': '<',     # LEFT DOUBLE ANGLE BRACKET
        '》': '>',     # RIGHT DOUBLE ANGLE BRACKET
        'Ç': 'C',     # LATIN CAPITAL LETTER C WITH CEDILLA
        'ò': 'o',     # LATIN SMALL LETTER O WITH GRAVE
        'ù': 'u',     # LATIN SMALL LETTER U WITH GRAVE
        'û': 'u',     # LATIN SMALL LETTER U WITH CIRCUMFLEX
        'ę': 'e',     # LATIN SMALL LETTER E WITH OGONEK
        'ȃ': 'a',     # LATIN SMALL LETTER A WITH INVERTED BREVE
        '̀': "'",      # COMBINING GRAVE ACCENT
        'ό': 'o',     # GREEK SMALL LETTER OMICRON WITH TONOS
        'ỳ': 'y',     # LATIN SMALL LETTER Y WITH GRAVE
        '\u2009': ' ',# THIN SPACE
        '\u202f': ' ',# NARROW NO-BREAK SPACE
    }
    
    for k, v in typographic_replacements.items():
        text = text.replace(k, v)

    if args.extreme:
        text = text.lower()

    chars = parse_csv(args.font_csv)

    if args.transliterate and not is_font_supports_russian(chars):
        text = transliterate_russian(text)

    known_chars = set(chars.keys()) | {' ', '\n'}
    text = encode_unknown_chars(text, known_chars)

    if args.extreme:
        subscript_map = {
            '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄',
            '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉'
        }
        for k, v in subscript_map.items():
            text = text.replace(k, v)

    if args.size == "5x5":
        max_rows = 5
        max_cols = 5
        space_width = 3
    elif args.size == "5x4":
        max_rows = 5
        max_cols = 4
        # Since get_char_width already appends a 1-pixel gap after each letter,
        # advancing by 3 here yields a total visual gap of 1 + 3 = 4 pixels.
        space_width = 3
    else:
        max_rows = 4
        max_cols = 3
        # Advancing by 2 here yields a total visual gap of 1 + 2 = 3 pixels.
        space_width = 2

    # Calculate dimensions for A4 (210 x 297 mm)
    width_px = int((210 / 25.4) * args.dpi)
    height_px = int((297 / 25.4) * args.dpi)
    margin_px = int((args.margin_mm / 25.4) * args.dpi)
    
    images = []
    
    img = Image.new("1", (width_px, height_px), color=1) # 1-bit pixels, white background
    draw = ImageDraw.Draw(img)

    x = margin_px
    y = margin_px
    line_height = max_rows
    
    def get_word_width(word):
        w = 0
        for c in word:
            if c == ' ':
                w += space_width
                continue
            grid = chars.get(c)
            if grid is None:
                grid = chars.get('.notdef', [])
            w += get_char_width(grid, max_cols)
        return w * args.scale

    if args.compact:
        # Collapse all whitespace, including newlines, into single spaces
        text = " ".join(text.split())
        lines = [text]
    else:
        lines = text.split('\n')

    for line in lines:
        words = []
        current_word = []
        for c in line:
            if c == ' ':
                if current_word:
                    words.append("".join(current_word))
                    current_word = []
                # Only append space if we didn't just append a space 
                # OR if not compact/extreme.
                if args.compact:
                    if not words or words[-1] != " ":
                        words.append(" ")
                else:
                    words.append(" ")
            else:
                current_word.append(c)
        if current_word:
            words.append("".join(current_word))
            
        for word in words:
            word_width = get_word_width(word)
            if word == " " and x == margin_px:
                continue # Skip leading spaces on wrapped lines
                
            if x + word_width > width_px - margin_px:
                if word == " ":
                    continue # single space does not need to wrap
                # Line wrap
                x = margin_px
                y += (line_height + args.line_gap) * args.scale
                if y > height_px - margin_px:
                    images.append(img)
                    img = Image.new("1", (width_px, height_px), color=1)
                    draw = ImageDraw.Draw(img)
                    x = margin_px
                    y = margin_px
            if word == " ":
                x += space_width * args.scale
            else:
                for c in word:
                    grid = chars.get(c)
                    if grid is None:
                        grid = chars.get('.notdef', [])
                        
                    c_w = get_char_width(grid, max_cols)
                    draw_char(draw, grid, x, y, max_rows, max_cols, args.scale)
                    x += c_w * args.scale
                    
        # explicit newline
        x = margin_px
        y += (line_height + args.line_gap) * args.scale

    images.append(img)
    
    import os
    base, ext = os.path.splitext(args.out)
    if not ext:
        ext = ".png"

    if len(images) == 1:
        images[0].save(args.out)
        print(f"Saved to {args.out} (Size: {width_px}x{height_px}, DPI: {args.dpi})")
    else:
        for i, im in enumerate(images):
            out_name = f"{base}_{i+1}{ext}"
            im.save(out_name)
            print(f"Saved to {out_name} (Size: {width_px}x{height_px}, DPI: {args.dpi})")

if __name__ == "__main__":
    main()
