#!/bin/bash
#
# MediaChief - COMPLETE WordPress Migration (One-Click)
#
# This script does EVERYTHING:
#   1. Exports all data from every WordPress site (articles, campaigns, GA, GSC, theme, etc.)
#   2. Imports everything into MediaChief Laravel app
#
# Run on Hostinger:
#   cd ~/mediachief/tools
#   bash migrate-everything.sh
#
# Or step by step:
#   bash migrate-everything.sh export    # Only export
#   bash migrate-everything.sh import    # Only import (after export)
#

set -euo pipefail

# ── Configuration ──
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MEDIACHIEF_DIR="$(dirname "$SCRIPT_DIR")"
EXPORT_SCRIPT="${SCRIPT_DIR}/mediachief-export.php"
EXPORTS_DIR="${SCRIPT_DIR}/exports"
LOG_FILE="${EXPORTS_DIR}/migration.log"

# Colors
G='\033[0;32m'  # Green
R='\033[0;31m'  # Red
Y='\033[1;33m'  # Yellow
B='\033[0;34m'  # Blue
C='\033[0;36m'  # Cyan
NC='\033[0m'    # No Color

log() { echo -e "$1" | tee -a "$LOG_FILE"; }

# ═══════════════════════════════════════════════════
# ══ STEP 1: EXPORT ALL WORDPRESS SITES
# ═══════════════════════════════════════════════════
do_export() {
    log "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${B}  STEP 1: Export ALL WordPress Sites${NC}"
    log "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log ""

    if [ ! -f "$EXPORT_SCRIPT" ]; then
        log "${R}ERROR: mediachief-export.php not found at: ${EXPORT_SCRIPT}${NC}"
        exit 1
    fi

    mkdir -p "$EXPORTS_DIR"

    # Find all WordPress installations
    WP_SITES=()
    for search_path in "$HOME/domains" "$HOME/public_html"; do
        if [ -d "$search_path" ]; then
            while IFS= read -r wpload; do
                wp_root="$(dirname "$wpload")"
                if [ -f "${wp_root}/wp-config.php" ]; then
                    WP_SITES+=("$wp_root")
                fi
            done < <(find "$search_path" -maxdepth 3 -name "wp-load.php" -type f 2>/dev/null)
        fi
    done

    # Remove duplicates
    WP_SITES=($(printf "%s\n" "${WP_SITES[@]}" | sort -u))

    log "${G}Found ${#WP_SITES[@]} WordPress sites${NC}"
    log ""

    SUCCESS=0
    FAIL=0

    for site_path in "${WP_SITES[@]}"; do
        domain=$(basename "$(dirname "$site_path")" 2>/dev/null || basename "$site_path")
        safe_domain=$(echo "$domain" | sed 's/[^a-zA-Z0-9.-]/_/g')
        output_file="${EXPORTS_DIR}/${safe_domain}.json"

        log -n "  ${Y}${domain}${NC} ... "

        # Copy export script
        cp "$EXPORT_SCRIPT" "${site_path}/mediachief-export.php" 2>/dev/null

        # Patch: clean output buffers before SHORTINIT
        sed -i '/define.*SHORTINIT/i\
while (ob_get_level() > 0) { @ob_end_clean(); }\
ob_start();' "${site_path}/mediachief-export.php" 2>/dev/null

        # Patch: clean OB after wp-load
        sed -i "/require_once __DIR__.*wp-load/a\\
ob_end_clean();\\
remove_action('shutdown', 'wp_ob_end_flush_all', 1);" "${site_path}/mediachief-export.php" 2>/dev/null

        # Run export with generous limits
        OUTPUT=$(php -d memory_limit=512M -d max_execution_time=600 -d display_errors=0 "${site_path}/mediachief-export.php" 2>/dev/null) || true

        # Cleanup export script from WP dir
        rm -f "${site_path}/mediachief-export.php"

        # Validate JSON
        if [ -n "$OUTPUT" ]; then
            echo "$OUTPUT" > "$output_file"
            VALID=$(php -r "
                \$d = json_decode(file_get_contents('$output_file'), true);
                if (\$d === null) { echo 'INVALID:' . json_last_error_msg(); exit; }
                if (!empty(\$d['error'])) { echo 'ERROR:' . (\$d['message'] ?? 'unknown'); exit; }
                \$p = count(\$d['posts'] ?? []);
                \$c = count(\$d['campaigns'] ?? []);
                \$cat = count(\$d['categories'] ?? []);
                \$pg = count(\$d['pages'] ?? []);
                echo \"OK|\$p|\$c|\$cat|\$pg\";
            " 2>&1)

            if [[ "$VALID" == OK* ]]; then
                IFS='|' read -r _ POSTS CAMPS CATS PAGES <<< "$VALID"
                FILESIZE=$(stat -c%s "$output_file" 2>/dev/null || echo "?")
                log "${G}OK${NC} - ${POSTS} posts, ${CAMPS} campaigns, ${CATS} categories, ${PAGES} pages (${FILESIZE} bytes)"
                SUCCESS=$((SUCCESS + 1))
            else
                log "${R}FAIL${NC} - $VALID"
                log "    First 200 chars: $(head -c 200 "$output_file")" >> "$LOG_FILE"
                rm -f "$output_file"
                FAIL=$((FAIL + 1))
            fi
        else
            log "${R}FAIL${NC} - empty output"
            FAIL=$((FAIL + 1))
        fi
    done

    log ""
    log "${B}Export Summary: ${G}${SUCCESS} OK${NC}, ${R}${FAIL} failed${NC}"
    log "Exports saved to: ${EXPORTS_DIR}/"
    log ""

    return 0
}

# ═══════════════════════════════════════════════════
# ══ STEP 2: IMPORT INTO MEDIACHIEF
# ═══════════════════════════════════════════════════
do_import() {
    log "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${B}  STEP 2: Import EVERYTHING into MediaChief${NC}"
    log "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log ""

    # Check exports exist
    JSON_COUNT=$(ls -1 "${EXPORTS_DIR}"/*.json 2>/dev/null | wc -l)
    if [ "$JSON_COUNT" -eq 0 ]; then
        log "${R}ERROR: No JSON exports found in ${EXPORTS_DIR}${NC}"
        log "Run the export first: bash migrate-everything.sh export"
        exit 1
    fi

    log "${C}Found ${JSON_COUNT} export files${NC}"
    log ""

    # Pull latest code
    log "${Y}Pulling latest code from git...${NC}"
    cd "$MEDIACHIEF_DIR"
    git pull origin "$(git rev-parse --abbrev-ref HEAD)" 2>&1 | tee -a "$LOG_FILE" || true
    log ""

    # Run migrations
    log "${Y}Running database migrations...${NC}"
    php artisan migrate --force 2>&1 | tee -a "$LOG_FILE"
    log ""

    # Import EVERYTHING from JSON exports
    log "${Y}Importing all data from exports...${NC}"
    log ""

    php artisan wp:import-all \
        --dir="${EXPORTS_DIR}" \
        --all \
        --auto-publish \
        2>&1 | tee -a "$LOG_FILE"

    log ""
    log "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log "${G}  MIGRATION COMPLETE!${NC}"
    log "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    log ""
    log "What was imported for each site:"
    log "  - Settings (GA, GTM, AdSense, Search Console)"
    log "  - SEO plugin config (Yoast/Rank Math/AIO SEO)"
    log "  - Theme (colors, custom CSS, images, all mods)"
    log "  - Navigation menus"
    log "  - Widgets"
    log "  - Categories with hierarchy"
    log "  - RSS campaigns (WP Automatic, WP RSS Aggregator, etc.)"
    log "  - ALL articles with metadata"
    log "  - Pages"
    log ""
    log "Log file: ${LOG_FILE}"

    return 0
}

# ═══════════════════════════════════════════════════
# ══ MAIN
# ═══════════════════════════════════════════════════

mkdir -p "$EXPORTS_DIR"
echo "" > "$LOG_FILE"

log "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${B}  MediaChief - Complete WordPress Migration${NC}"
log "${B}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
log "${B}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log ""

case "${1:-all}" in
    export)
        do_export
        ;;
    import)
        do_import
        ;;
    all|*)
        do_export
        do_import
        ;;
esac
