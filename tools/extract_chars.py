import csv
import sys
import unicodedata

def load_font_chars(csv_path):
    chars = set()
    try:
        with open(csv_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            for row in reader:
                if row and row[0]:
                    chars.add(row[0])
    except Exception as e:
        print(f"Error loading {csv_path}: {e}")
    # Add Space manually
    chars.add(' ')
    # Add standard newlines since we split lines anyway
    chars.add('\n')
    chars.add('\r')
    return chars

def main():
    import os
    font_csv = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "docs", "definitions", "Times_Sitelew_Roman_5x5_pixels.csv")
    import argparse
    parser = argparse.ArgumentParser(description="Extract unique missing characters from a text file.")
    parser.add_argument("text_file", nargs='?', default="War_and_Peace_Tolstoy.txt", help="Input text file")
    args = parser.parse_args()
    
    text_file = args.text_file
    
    existing_chars = load_font_chars(font_csv)

    # Existing normalization rules from render_text.py
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
        '´': "'",    # Acute accent (often used as apostrophe)
        '`': "'",    # Grave accent
        # Replacements based on War and Peace extraction
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
    }

    try:
        with open(text_file, 'r', encoding='utf-8') as f:
            text = f.read()
    except Exception as e:
        print(f"Could not read {text_file}: {e}")
        sys.exit(1)

    unique_chars = set(text)
    print(f"Total unique characters in document: {len(unique_chars)}")

    missing_chars = []
    
    for c in unique_chars:
        # If it's in the font, it's fine
        if c in existing_chars:
            continue
        
        # If it's normalized away, it's "fine" because we handle it
        if c in typographic_replacements:
            continue
            
        missing_chars.append(c)
        
    print(f"Missing characters: {len(missing_chars)}")
    print("=" * 40)
    for c in sorted(missing_chars):
        try:
            name = unicodedata.name(c)
        except ValueError:
            name = "UNKNOWN"
        print(f"Char: {repr(c)} - {name}")

if __name__ == "__main__":
    main()
