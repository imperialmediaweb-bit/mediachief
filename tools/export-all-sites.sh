#!/bin/bash
#
# MediaChief - Batch WordPress Export Script
#
# Run this on Hostinger via SSH to export ALL WordPress sites at once.
# It copies mediachief-export.php to each WP site and runs it.
#
# Usage:
#   1. Upload this script + mediachief-export.php to Hostinger
#   2. chmod +x export-all-sites.sh
#   3. ./export-all-sites.sh
#
# The script will:
#   - Auto-detect WordPress installations in ~/domains/
#   - Copy mediachief-export.php to each site
#   - Run the export and save JSON files
#   - Create a combined all-sites-export.json
#
# After running, download the exports/ directory and import with:
#   php artisan wp:import-all --dir=exports/

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
EXPORT_SCRIPT="${SCRIPT_DIR}/mediachief-export.php"
OUTPUT_DIR="${SCRIPT_DIR}/exports"
COMBINED_FILE="${OUTPUT_DIR}/all-sites-export.json"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}  MediaChief - Batch WordPress Export${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Check export script exists
if [ ! -f "$EXPORT_SCRIPT" ]; then
    echo -e "${RED}ERROR: mediachief-export.php not found at: ${EXPORT_SCRIPT}${NC}"
    echo "Make sure mediachief-export.php is in the same directory as this script."
    exit 1
fi

# Create output directory
mkdir -p "$OUTPUT_DIR"

# Auto-detect WordPress installations
echo -e "${YELLOW}Scanning for WordPress installations...${NC}"
echo ""

WP_SITES=()

# Check common Hostinger paths
SEARCH_PATHS=(
    "$HOME/domains"
    "$HOME/public_html"
    "/home/*/domains"
    "/home/*/public_html"
)

for search_path in "${SEARCH_PATHS[@]}"; do
    if [ -d "$search_path" ]; then
        # Find wp-load.php (indicates WordPress root)
        while IFS= read -r wpload; do
            wp_root="$(dirname "$wpload")"
            # Skip if in a subdirectory like wp-includes
            if [ -f "${wp_root}/wp-config.php" ]; then
                WP_SITES+=("$wp_root")
            fi
        done < <(find "$search_path" -maxdepth 3 -name "wp-load.php" -type f 2>/dev/null)
    fi
done

# Remove duplicates
WP_SITES=($(printf "%s\n" "${WP_SITES[@]}" | sort -u))

if [ ${#WP_SITES[@]} -eq 0 ]; then
    echo -e "${RED}No WordPress installations found!${NC}"
    echo ""
    echo "Searched in:"
    for p in "${SEARCH_PATHS[@]}"; do
        echo "  - $p"
    done
    echo ""
    echo "You can manually specify paths:"
    echo "  ./export-all-sites.sh /path/to/wordpress1 /path/to/wordpress2"
    exit 1
fi

# Allow manual paths as arguments
if [ $# -gt 0 ]; then
    WP_SITES=("$@")
    echo -e "${YELLOW}Using manually specified paths...${NC}"
fi

echo -e "${GREEN}Found ${#WP_SITES[@]} WordPress sites:${NC}"
echo ""
for site in "${WP_SITES[@]}"; do
    domain=$(basename "$(dirname "$site")" 2>/dev/null || basename "$site")
    echo "  - $domain ($site)"
done
echo ""

# Confirm
read -p "Export all ${#WP_SITES[@]} sites? (y/N) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
fi

echo ""

# Export each site
SUCCESS=0
FAILED=0
COMBINED="["

for site_path in "${WP_SITES[@]}"; do
    domain=$(basename "$(dirname "$site_path")" 2>/dev/null || basename "$site_path")
    safe_domain=$(echo "$domain" | sed 's/[^a-zA-Z0-9.-]/_/g')
    output_file="${OUTPUT_DIR}/${safe_domain}.json"

    echo -ne "${YELLOW}Exporting ${domain}...${NC} "

    # Copy export script to WordPress root
    cp "$EXPORT_SCRIPT" "${site_path}/mediachief-export.php" 2>/dev/null

    # Run the export
    if php "${site_path}/mediachief-export.php" > "$output_file" 2>/dev/null; then
        # Validate JSON
        if python3 -c "import json; json.load(open('${output_file}'))" 2>/dev/null || \
           php -r "json_decode(file_get_contents('${output_file}')); exit(json_last_error() === JSON_ERROR_NONE ? 0 : 1);" 2>/dev/null; then

            campaigns=$(php -r "echo count(json_decode(file_get_contents('${output_file}'), true)['campaigns'] ?? []);" 2>/dev/null || echo "?")
            categories=$(php -r "echo count(json_decode(file_get_contents('${output_file}'), true)['categories'] ?? []);" 2>/dev/null || echo "?")

            echo -e "${GREEN}OK${NC} (${campaigns} campaigns, ${categories} categories)"
            SUCCESS=$((SUCCESS + 1))

            # Add to combined file
            if [ $SUCCESS -gt 1 ]; then
                COMBINED="${COMBINED},"
            fi
            COMBINED="${COMBINED}$(cat "$output_file")"
        else
            echo -e "${RED}FAILED (invalid JSON)${NC}"
            rm -f "$output_file"
            FAILED=$((FAILED + 1))
        fi
    else
        echo -e "${RED}FAILED (PHP error)${NC}"
        rm -f "$output_file"
        FAILED=$((FAILED + 1))
    fi

    # Clean up export script from WordPress root
    rm -f "${site_path}/mediachief-export.php"
done

# Save combined file
COMBINED="${COMBINED}]"
echo "$COMBINED" > "$COMBINED_FILE"

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}Export complete!${NC}"
echo -e "  Success: ${GREEN}${SUCCESS}${NC}"
echo -e "  Failed:  ${RED}${FAILED}${NC}"
echo -e "  Output:  ${OUTPUT_DIR}/"
echo -e "  Combined: ${COMBINED_FILE}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Download the exports/ directory to your local machine"
echo "  2. Import into MediaChief:"
echo "     php artisan wp:import-all --dir=path/to/exports/"
echo "  3. Or import individual sites:"
echo "     php artisan wp:import-campaigns --site=1 --file=exports/alabama-express.com.json"
