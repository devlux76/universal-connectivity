#!/bin/bash
# filepath: ./refactor.sh
# This script finds files with .ts, .tsx, .js, and .jsx extensions (excluding node_modules and .git)
# that have more than 100 lines. It then sorts them (ascending by line count) and writes the output to refactor.md.

OUTPUT_FILE="refactor.md"

# Write header to the markdown file.
echo "# Files to Refactor (More Than 100 Lines)" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Use find and exclude directories listed in .gitignore (example: node_modules, .git)
# Adjust the excluded patterns as needed.
find . -type f \( -iname "*.ts" -o -iname "*.tsx" -o -iname "*.js" -o -iname "*.jsx" \) \
    ! -path "./node_modules/*" ! -path "./.git/*" -print0 | while IFS= read -r -d '' file; do
    line_count=$(wc -l < "$file")
    if [ "$line_count" -gt 128 ]; then
        # Output format: number_of_lines - relative path to file.
        echo "$line_count - $file"
    fi
done | sort -nr >> "$OUTPUT_FILE"

echo "Refactor report saved to $OUTPUT_FILE"