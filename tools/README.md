# render_text.py

`render_text.py` is a Python script that renders text from a text file into a pixel-precise A4-proportioned PNG image. It uses text representation stored directly in a CSV file (e.g. `../docs/definitions/Times_Sitelew_Roman_5x5_pixels.csv`), which specifies pixel grids for each character. 

The main advantage of using this script is that it parses the native pixel matrices instead of a compiled TTF font, allowing exact 1:1 pixel rendering for small-scale pixel typography (such as a 5-pixel high letter). It correctly handles word wrapping and dynamic character spacing to ensure optimal text density per letter while maintaining proper spacing.

## Features
- **Accurate Dimensions**: Automatically calculates the necessary A4 image dimensions based on the target DPI (e.g., a 300 DPI will result in an image size of 2480x3507 pixels).
- **Pixel-Precise Rendering**: Draws letters precisely using 1-bit `.png` format.
- **Dynamic Character Width**: Uses the active width of the actual letter.
- **Font Scaling**: Includes an optional scaling factor if you want each layout "pixel" to be represented by a 2x2 or larger block of image pixels.
- **Word Wrapping**: Implements word-wrapping logic so text nicely fits inside the page margins.
- **Multi-page Output**: If text overflows the bounds of a single image, the script automatically saves the image and continues rendering on sequentially numbered images (e.g., `output_1.png`, `output_2.png`).
- **Character Normalization**: Automatically converts typographic characters (such as em-dashes `—` and smart quotes `“”`) into standard ASCII formats (`-` and `""` respectively) that exist in the font set.
- **Compact Mode**: Optional `--compact` flag to ignore newlines and continuous spacing, saving space by filling the page as densely as possible.
- **Extreme Mode**: Optional `--extreme` flag for maximum density. Assumes compact mode, converts text to lowercase, maps digits to subscript equivalents (e.g. `9` -> `₉`), and overlaps line spacing precisely 1 pixel apart to remove vertical gaps.

## Requirements
Ensure you have the required dependencies from `requirements.txt` installed. Most notably, it requires the Python Imaging Library (Pillow).
```bash
pip install -r requirements.txt
```

## Usage
Simply run `render_text.py` and pass the required arguments.

```bash
python render_text.py --text input_text.txt
```

### Options
- `--text`: (Required) Path to the `.txt` file containing the text to be rendered.
- `--out`: Path to save the resulting image (default: `output.png`).
- `--dpi`: Target printing resolution (DPI) which determines the final image size (default: `300`).
- `--font-csv`: The CSV file containing the font structure (default: `../docs/definitions/Times_Sitelew_Roman_5x5_pixels.csv`).
- `--scale`: Scale factor. E.g., `--scale 2` makes every conceptual pixel 2x2 physical pixels (default: `1`).
- `--size`: Target grid size mapping constraint (`5x5`, `5x4` or `4x3`, default: `5x5`).
- `--margin-mm`: Page margin in millimeters (default: `10`).
- `--line-gap`: The gap between lines measured in conceptual pixels (default: `1`).
- `--compact`: If activated, ignores newlines and continuous spaces, fitting text as densely as possible.
- `--extreme`: If activated, implies compact mode, but also converts text to lowercase, applies subscript mappings to digits, and overlaps line rendering to leave only 1 pixel space vertically between lowercase characters.
- `--no-legend`: Disable the automatic inclusion of `character_legend.txt` at the beginning of the rendered text.

### Example
Render `input_text.txt` at 300 DPI, saving the output as `poster.png`:
```bash
python render_text.py --text input_text.txt --out poster.png --dpi 300
```

## Other Tools

In addition to the primary rendering script, this project includes several utility scripts:

- **`build_font.py`**: A vital script that parses the `5x5`, `5x4` or `4x3` CSV-based pixel grid definitions and generates a standard `.ttf` (TrueType Font) file. It uses the `fonttools` library for constructing bounding boxes and defining character mappings. Run this when you've modified the `.csv` definitions and need to regenerate the font files. Example: `python build_font.py --size 5x5`
- **`extract_chars.py`**: A utility designed to read an input text file and identify any unique characters that are *not* currently supported in the active `.csv` font definition. It handles typographic normalization and outputs the list of unsupported characters to help you expand the font coverage.
- **`find_missing_chars.py`**: Compares the character set supported by the font against specific language subsets (e.g., standard Russian, German, or Spanish alphabets) to find missing letters and symbols required to write those languages fluently.
- **`parse_csv.py`**: A small helper/test script to quickly ensure the font `.csv` files are following the correct format (checking for rows longer than the configured grid size, etc).
