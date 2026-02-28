import csv

import os

csv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'docs', 'definitions', 'Times_Sitelew_Roman_5x5_pixels.csv')
with open(csv_path, 'r') as f:
    reader = csv.reader(f)
    lines = list(reader)

chars = {}
curr_char = None
curr_grid = []
for row in lines:
    if not row:
        continue
    # A new char if row has format char, "", "", ""
    # wait, could just check if first column is not empty
    if row[0]:
        if curr_char is not None:
            chars[curr_char] = curr_grid
        curr_char = row[0]
        curr_grid = []
    else:
        # data row
        if len(row) > 1:
            curr_grid.append(row[1:])
        else:
            curr_grid.append(["", "", ""])
            
if curr_char is not None:
    chars[curr_char] = curr_grid

for c, grid in chars.items():
    if len(grid) > 5:
        for r in grid[5:]:
            for cell in r:
                if "#" in cell:
                    print(f"Char {c} uses row > 4: {r}")
