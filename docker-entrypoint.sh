#!/bin/bash
set -e

# Run migrations
php artisan migrate --force 2>/dev/null || true

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Start cron for RSS feeds in background
echo "*/5 * * * * cd /var/www/html && php artisan rss:fetch >> /dev/null 2>&1" | crontab -
cron

# Start queue worker in background
php artisan queue:work --stop-when-empty --queue=rss,ai --tries=3 --timeout=180 &

# Start Apache
exec "$@"
