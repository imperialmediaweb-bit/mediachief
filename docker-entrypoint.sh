#!/bin/bash
set -e

# Railway sets PORT env variable - configure Apache to listen on it
if [ -n "$PORT" ]; then
    sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf
    sed -i "s/:80/:$PORT/" /etc/apache2/sites-available/*.conf
fi

# Run migrations
php artisan migrate --force 2>/dev/null || true

# Create admin user if it doesn't exist
php artisan tinker --execute="App\Models\User::firstOrCreate(['email'=>'admin@mediachief.ro'],['name'=>'Admin','password'=>bcrypt(env('ADMIN_PASSWORD','ChangeMeNow!'))]);" 2>/dev/null || true

# Cache configuration
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Storage link
php artisan storage:link 2>/dev/null || true

# Start queue worker in background (continuous)
php artisan queue:work --queue=rss,ai --tries=3 --timeout=180 --sleep=10 --max-jobs=100 --max-time=3600 &

# Start Laravel scheduler via loop (cron not available in most Railway containers)
while true; do
    php artisan schedule:run >> /dev/null 2>&1
    sleep 60
done &

# Start Apache
exec "$@"
