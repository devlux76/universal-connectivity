#!/usr/bin/env bash

# Constants for file size limits (in bytes)
WARNING_SIZE=$((8 * 1024))    # 8KB
REJECTION_SIZE=$((16 * 1024)) # 16KB

# Function to check if file is a code file
is_code_file() {
    local file="$1"
    case "$file" in
        *.ts|*.tsx|*.js|*.jsx|*.go|*.rs|*.py|*.java|*.cpp|*.hpp|*.c|*.h|*.cs|*.rb|*.php)
            return 0 ;;
        *)
            return 1 ;;
    esac
}

# Function to check file sizes
check_file_sizes() {
    for file in $(git ls-files --cached --others --exclude-standard); do
        if [[ -f $file ]] && is_code_file "$file"; then
            size=$(wc -c < "$file")
            if [ "$size" -ge "$REJECTION_SIZE" ]; then
                echo "Error: $file is larger than 16KB. Please refactor the file."
            elif [ "$size" -ge "$WARNING_SIZE" ]; then
                echo "Warning: $file is larger than 8KB."
            fi
        fi
    done
}

# Run the check
check_file_sizes
