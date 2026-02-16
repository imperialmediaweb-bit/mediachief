#!/bin/bash
# Retry failed WordPress exports with output buffering fix
# Run on server: bash ~/exports/debug-failed-exports.sh

FAILED_SITES=(
    "alaskaexpres.com"
    "californiaexpres.com"
    "coloradoexpres.com"
    "maryland-express.com"
    "massachusettsexpress.com"
    "mississippi-express.com"
    "nebraska-express.com"
    "newmexico-express.com"
    "northcarolinasexpress.com"
    "westvirginia-express.com"
)

SUCCESS=0
FAIL=0

echo "============================================"
echo "  Retry Failed Exports (v3)"
echo "============================================"
echo ""

for domain in "${FAILED_SITES[@]}"; do
    dir="$HOME/domains/$domain/public_html"
    echo "--- $domain ---"

    if [ ! -d "$dir" ] || [ ! -f "$dir/wp-load.php" ]; then
        echo "  SKIP: WordPress not found"; FAIL=$((FAIL+1)); continue
    fi

    # Copy export script to WP dir
    cp "$HOME/exports/mediachief-export.php" "$dir/" 2>/dev/null

    # Patch the COPY: add OB cleanup before the define('SHORTINIT') line
    sed -i '/define.*SHORTINIT/i\
while (ob_get_level() > 0) { @ob_end_clean(); }\
ob_start();' "$dir/mediachief-export.php"

    # Patch the COPY: add OB discard + remove shutdown hook after wp-load require
    sed -i "/require_once __DIR__.*wp-load/a\\
ob_end_clean();\\
remove_action('shutdown', 'wp_ob_end_flush_all', 1);" "$dir/mediachief-export.php"

    # Run the patched export
    OUTPUT=$(php -d memory_limit=512M -d max_execution_time=600 -d display_errors=1 -d error_reporting=E_ALL "$dir/mediachief-export.php" 2>&1)
    EXIT_CODE=$?

    # Cleanup
    rm -f "$dir/mediachief-export.php"

    if [ $EXIT_CODE -ne 0 ]; then
        echo "  FAIL (exit $EXIT_CODE): $(echo "$OUTPUT" | grep -i 'fatal\|error' | head -3)"
        FAIL=$((FAIL+1)); continue
    fi

    # Save and validate
    echo "$OUTPUT" > "/tmp/export_${domain}.json"
    FILESIZE=$(stat -c%s "/tmp/export_${domain}.json" 2>/dev/null || echo "0")
    VALID=$(php -r "\$d=json_decode(file_get_contents('/tmp/export_${domain}.json'),true);if(\$d===null){echo 'INVALID: '.json_last_error_msg();}else{echo 'OK|'.count(\$d['posts']??[]).'|'.count(\$d['campaigns']??[]);}" 2>&1)

    if [[ "$VALID" == OK* ]]; then
        IFS='|' read -r _ POSTS CAMPS <<< "$VALID"
        cp "/tmp/export_${domain}.json" "$HOME/exports/${domain}.json"
        echo "  OK - ${FILESIZE} bytes, ${POSTS} posts, ${CAMPS} campaigns"
        SUCCESS=$((SUCCESS+1))
    else
        echo "  FAIL (invalid JSON): $VALID"
        echo "  First 300 chars: $(head -c 300 /tmp/export_${domain}.json)"
        FAIL=$((FAIL+1))
    fi
    rm -f "/tmp/export_${domain}.json"
done

echo ""
echo "Done: $SUCCESS succeeded, $FAIL failed"
