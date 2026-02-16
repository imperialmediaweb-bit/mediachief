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

# Wait for database to be ready (max 30 seconds)
echo "Waiting for database connection..."
DB_READY=false
for i in $(seq 1 15); do
    if php artisan db:monitor --databases=mysql 2>/dev/null | grep -q "OK"; then
        DB_READY=true
        echo "Database is ready!"
        break
    fi
    # Simple PHP connection test as fallback
    if php -r "try { new PDO('mysql:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}', '${DB_USERNAME}', '${DB_PASSWORD}', [PDO::ATTR_TIMEOUT => 2]); echo 'ok'; } catch(Exception \$e) { echo 'fail'; }" 2>/dev/null | grep -q "ok"; then
        DB_READY=true
        echo "Database is ready!"
        break
    fi
    echo "  Attempt $i/15 - waiting 2s..."
    sleep 2
done

if [ "$DB_READY" = true ]; then
    # Run migrations (with timeout)
    echo "Running migrations..."
    timeout 60 php artisan migrate --force 2>&1 || echo "Migration warning (may already be up to date)"

    # Create admin user if it doesn't exist
    echo "Ensuring admin user exists..."
    timeout 15 php artisan tinker --execute="App\Models\User::firstOrCreate(['email'=>'admin@mediachief.ro'],['name'=>'Admin','password'=>bcrypt(env('ADMIN_PASSWORD','ChangeMeNow!'))]);" 2>/dev/null || true

    # Cache configuration
    echo "Caching configuration..."
    timeout 15 php artisan config:cache 2>/dev/null || true
    timeout 15 php artisan route:cache 2>/dev/null || true
    timeout 15 php artisan view:cache 2>/dev/null || true

    # Storage link
    php artisan storage:link 2>/dev/null || true

    # Start queue worker in background
    php artisan queue:work --queue=rss,ai --tries=3 --timeout=180 --sleep=10 --max-jobs=100 --max-time=3600 &>/dev/null &

    # Start Laravel scheduler via loop
    while true; do
        php artisan schedule:run >> /dev/null 2>&1
        sleep 60
    done &
else
    echo "WARNING: Database not reachable. Starting without migrations."
    echo "  DB_HOST=${DB_HOST}"
    echo "  DB_PORT=${DB_PORT}"
    echo "  DB_DATABASE=${DB_DATABASE}"
    # Still cache what we can
    timeout 15 php artisan config:cache 2>/dev/null || true
    timeout 15 php artisan route:cache 2>/dev/null || true
    timeout 15 php artisan view:cache 2>/dev/null || true
    php artisan storage:link 2>/dev/null || true
fi

echo "Starting Apache..."
# Start Apache
exec "$@"
