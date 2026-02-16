#!/bin/bash

# Railway sets PORT env variable - configure Apache to listen on it
if [ -n "$PORT" ]; then
    sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf
    sed -i "s/:80/:$PORT/" /etc/apache2/sites-available/*.conf
fi

# Generate APP_KEY if not set
if [ -z "$APP_KEY" ]; then
    echo "WARNING: APP_KEY not set, generating one..."
    php artisan key:generate --force 2>/dev/null || true
fi

# Run migrations
php artisan migrate --force 2>/dev/null || true

# Create admin user if it doesn't exist
php artisan tinker --execute="App\Models\User::firstOrCreate(['email'=>'admin@mediachief.ro'],['name'=>'Admin','password'=>bcrypt(env('ADMIN_PASSWORD','ChangeMeNow!'))]);" 2>/dev/null || true

# Cache configuration (non-fatal if they fail)
php artisan config:cache 2>/dev/null || true
php artisan route:cache 2>/dev/null || true
php artisan view:cache 2>/dev/null || true

# Storage link
php artisan storage:link 2>/dev/null || true

# Start queue worker in background (only if queue is configured)
php artisan queue:work --queue=rss,ai --tries=3 --timeout=180 --sleep=10 --max-jobs=100 --max-time=3600 &>/dev/null &

# Start Laravel scheduler via loop
while true; do
    php artisan schedule:run >> /dev/null 2>&1
    sleep 60
done &

# Start Apache
exec "$@"
