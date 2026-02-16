#!/bin/bash

# Railway sets PORT env variable - configure Apache to listen on it
if [ -n "$PORT" ]; then
    sed -i "s/Listen 80/Listen $PORT/" /etc/apache2/ports.conf
    sed -i "s/:80/:$PORT/" /etc/apache2/sites-available/*.conf
fi

# Create .env file if it doesn't exist (Railway provides env vars, but Laravel needs .env for artisan commands)
if [ ! -f /var/www/html/.env ]; then
    echo "Creating .env from environment variables..."
    cat > /var/www/html/.env <<EOF
APP_NAME=${APP_NAME:-MediaChief}
APP_ENV=${APP_ENV:-production}
APP_KEY=${APP_KEY:-}
APP_DEBUG=${APP_DEBUG:-false}
APP_URL=${APP_URL:-http://localhost}

DB_CONNECTION=${DB_CONNECTION:-mysql}
DB_HOST=${DB_HOST:-127.0.0.1}
DB_PORT=${DB_PORT:-3306}
DB_DATABASE=${DB_DATABASE:-mediachief}
DB_USERNAME=${DB_USERNAME:-root}
DB_PASSWORD=${DB_PASSWORD:-}

CACHE_STORE=${CACHE_STORE:-database}
QUEUE_CONNECTION=${QUEUE_CONNECTION:-database}
SESSION_DRIVER=${SESSION_DRIVER:-database}
SESSION_LIFETIME=${SESSION_LIFETIME:-120}

LOG_CHANNEL=${LOG_CHANNEL:-stack}
LOG_STACK=${LOG_STACK:-single}
LOG_LEVEL=${LOG_LEVEL:-error}

FILESYSTEM_DISK=${FILESYSTEM_DISK:-local}

FILAMENT_PATH=${FILAMENT_PATH:-admin}

OPENAI_API_KEY=${OPENAI_API_KEY:-}
OPENAI_MODEL=${OPENAI_MODEL:-gpt-4o-mini}

PIXABAY_API_KEY=${PIXABAY_API_KEY:-}

ADMIN_PASSWORD=${ADMIN_PASSWORD:-ChangeMeNow!}
EOF
    chown www-data:www-data /var/www/html/.env
    chmod 640 /var/www/html/.env
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
