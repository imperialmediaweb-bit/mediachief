#!/bin/bash
# Debug script for failed WordPress exports
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

echo "============================================"
echo "  MediaChief - Debug Failed Exports"
echo "  $(date)"
echo "============================================"
echo ""

for domain in "${FAILED_SITES[@]}"; do
    dir="$HOME/domains/$domain/public_html"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "DOMAIN: $domain"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Check if directory exists
    if [ ! -d "$dir" ]; then
        echo "  ERROR: Directory $dir does NOT exist"
        echo ""
        continue
    fi

    # Check wp-load.php
    if [ ! -f "$dir/wp-load.php" ]; then
        echo "  ERROR: wp-load.php NOT found in $dir"
        ls -la "$dir/" 2>/dev/null | head -15
        echo ""
        continue
    fi

    # Check wp-config.php
    if [ ! -f "$dir/wp-config.php" ]; then
        echo "  WARNING: wp-config.php NOT found (may be in parent dir)"
    fi

    # Check disk space
    echo "  Disk usage: $(du -sh "$dir" 2>/dev/null | cut -f1)"

    # Check PHP version
    echo "  PHP version: $(php -v 2>/dev/null | head -1)"

    # Check database connection by loading WP
    echo "  Testing WordPress load..."
    cp "$HOME/exports/mediachief-export.php" "$dir/" 2>/dev/null

    # Run with FULL error output (no 2>/dev/null)
    OUTPUT=$(php -d memory_limit=512M -d max_execution_time=600 -d display_errors=1 -d error_reporting=E_ALL "$dir/mediachief-export.php" 2>&1)
    EXIT_CODE=$?

    echo "  Exit code: $EXIT_CODE"

    if [ $EXIT_CODE -ne 0 ]; then
        echo "  PHP ERROR OUTPUT:"
        echo "$OUTPUT" | head -30
    else
        # Check if output is valid JSON
        echo "$OUTPUT" > "/tmp/debug_${domain}.json"
        FILESIZE=$(stat -c%s "/tmp/debug_${domain}.json" 2>/dev/null || echo "0")
        echo "  Output size: $FILESIZE bytes"

        # Try to parse JSON
        VALID=$(php -r "
            \$d = json_decode(file_get_contents('/tmp/debug_${domain}.json'), true);
            if (\$d === null) {
                echo 'INVALID JSON: ' . json_last_error_msg();
                // Show first 500 chars of output for clues
                echo PHP_EOL . 'First 500 chars: ' . substr(file_get_contents('/tmp/debug_${domain}.json'), 0, 500);
            } else {
                echo 'VALID - Posts: ' . count(\$d['posts'] ?? []) . ', Campaigns: ' . count(\$d['campaigns'] ?? []);
            }
        " 2>&1)
        echo "  JSON check: $VALID"

        # If valid, copy to exports
        if [[ "$VALID" == VALID* ]]; then
            cp "/tmp/debug_${domain}.json" "$HOME/exports/${domain}.json"
            echo "  FIXED! Saved to ~/exports/${domain}.json"
        fi

        rm -f "/tmp/debug_${domain}.json"
    fi

    # Cleanup
    rm -f "$dir/mediachief-export.php"
    echo ""
done

echo "============================================"
echo "  Debug complete!"
echo "============================================"
