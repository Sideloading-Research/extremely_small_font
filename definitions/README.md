# Font Definitions

This directory contains the core pixel layout definitions for the fonts in CSV format. 

- **`Times_Sitelew_Roman_5x4_pixels.csv`**: The primary 5x4 pixel grid definitions for characters.
- **`Times_Sitelew_Roman_4x3_pixels.csv`**: An even smaller, more compact 4x3 pixel grid definition version.

These CSV files are parsed natively by the `render_text.py` script (located in `../tools/`) for 1:1 pixel rendering. They also act as the source values that `build_font.py` uses to compile standard `.ttf` files.
