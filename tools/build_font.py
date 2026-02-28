import csv
import argparse
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

def parse_csv(csv_path):
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        lines = list(reader)

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
                curr_grid.append([""] * 5) # enough padding
                
    if curr_char is not None:
        chars[curr_char] = curr_grid
        
    return chars

def get_char_width(grid, max_cols, cell_size):
    max_col = -1
    for row in grid:
        for col_idx, cell in enumerate(row):
            if col_idx >= max_cols:
                break
            if "#" in cell:
                if col_idx > max_col:
                    max_col = col_idx
    
    if max_col == -1:
        return cell_size * 2
        
    return (max_col + 1) * cell_size + cell_size

def draw_glyph(pen, grid, max_rows, max_cols):
    cell_size = 256
    for row_idx, row in enumerate(grid):
        if row_idx >= max_rows:
            break
        y_bottom = (max_rows - 1 - row_idx) * cell_size
        y_top = y_bottom + cell_size
        for col_idx, cell in enumerate(row):
            if col_idx >= max_cols:
                break
            if "#" in cell:
                x_left = col_idx * cell_size
                x_right = x_left + cell_size
                pen.moveTo((x_left, y_bottom))
                pen.lineTo((x_left, y_top))
                pen.lineTo((x_right, y_top))
                pen.lineTo((x_right, y_bottom))
                pen.closePath()

def build_font(mode):
    import os
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    if mode == "5x5":
        csv_path = os.path.join(base_dir, 'docs', 'definitions', 'Times_Sitelew_Roman_5x5_pixels.csv')
        max_rows = 5
        max_cols = 5
        upm = 1536
        advance_width = 1536
        char_width = 1280
        font_name = "Times Sitelew Roman 5x5 pixels"
        out_file = os.path.join(base_dir, 'ttf_fonts', 'Times_Sitelew_Roman_5x5_pixels.ttf')
    elif mode == "5x4":
        csv_path = os.path.join(base_dir, 'docs', 'definitions', 'Times_Sitelew_Roman_5x4_pixels.csv')
        max_rows = 5
        max_cols = 4
        # 4 cols * 256 = 1024 width + 1 col space -> 1280
        # 5 rows * 256 = 1280 height upm
        upm = 1280
        advance_width = 1280
        char_width = 1024
        font_name = "Times Sitelew Roman 5x4 pixels"
        out_file = os.path.join(base_dir, 'ttf_fonts', 'Times_Sitelew_Roman_5x4_pixels.ttf')
    else:
        csv_path = os.path.join(base_dir, 'docs', 'definitions', 'Times_Sitelew_Roman_4x3_pixels.csv')
        max_rows = 4
        max_cols = 3
        # 3 cols * 256 = 768 width + 1 col space -> 1024
        # 4 rows * 256 = 1024 height upm
        upm = 1024
        advance_width = 1024
        char_width = 768
        font_name = "Times Sitelew Roman 4x3 pixels"
        out_file = os.path.join(base_dir, 'ttf_fonts', 'Times_Sitelew_Roman_4x3_pixels.ttf')

    chars = parse_csv(csv_path)
    
    builder = FontBuilder(upm, isTTF=True)
    
    glyph_order = ['.notdef', 'space']
    cmap = {32: 'space'}
    
    for char, grid in chars.items():
        if len(char) == 1:
            code = ord(char)
            name = f"uni{code:04X}"
            if name not in glyph_order:
                glyph_order.append(name)
            cmap[code] = name

    builder.setupGlyphOrder(glyph_order)
    builder.setupCharacterMap(cmap)
    
    glyphs = {}
    metrics = {}
    
    # space
    pen = TTGlyphPen(None)
    glyphs['space'] = pen.glyph()
    metrics['space'] = (advance_width, 0)
    
    for char, grid in chars.items():
        if len(char) == 1 or char == '.notdef':
            if len(char) == 1:
                code = ord(char)
                name = f"uni{code:04X}"
            else:
                name = '.notdef'
            pen = TTGlyphPen(None)
            draw_glyph(pen, grid, max_rows, max_cols)
            tt_glyph = pen.glyph()
            glyphs[name] = tt_glyph
            
            lsb = 0
            if hasattr(tt_glyph, 'xMin'):
                lsb = tt_glyph.xMin
            char_advance_width = get_char_width(grid, max_cols, 256)
            metrics[name] = (char_advance_width, lsb)
            
    for name in glyph_order:
        if name not in glyphs:
            pen = TTGlyphPen(None)
            glyphs[name] = pen.glyph()
            metrics[name] = (advance_width, 0)

    builder.setupGlyf(glyphs)
    builder.setupHorizontalMetrics(metrics)
    
    builder.setupHorizontalHeader(
        ascent=upm,
        descent=0,
        lineGap=256,
        advanceWidthMax=advance_width,
    )
    
    builder.setupNameTable({
        "familyName": font_name,
        "styleName": "Regular",
        "uniqueFontIdentifier": font_name,
        "fullName": font_name,
        "version": "Version 1.0",
        "psName": font_name.replace(" ", ""),
        "designer": "Roman Sitelew",
        "licenseDescription": "Public Domain license, no restrictions on use",
        "copyright": "Created by Roman Sitelew. Public Domain license, no restrictions on use",
    })
    
    builder.setupOS2(
        sTypoAscender=upm,
        sTypoDescender=0,
        sTypoLineGap=256,
        usWinAscent=upm,
        usWinDescent=0,
    )
    
    builder.setupPost()
    builder.save(out_file)
    print(f"Successfully built {out_file}")

def main():
    parser = argparse.ArgumentParser(description="Build Sitelew font from CSV.")
    parser.add_argument("--size", choices=["4x3", "5x4", "5x5"], default="5x5", help="Font grid size to build")
    args = parser.parse_args()
    build_font(args.size)

if __name__ == "__main__":
    main()
