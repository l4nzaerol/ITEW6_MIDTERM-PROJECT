#!/bin/bash

cd /app/backend

echo "Running migrations..."
php artisan migrate --force

echo "Checking if users table has data..."
# Use a simple inline PHP script that boots Laravel to check the User count
php -r "
require __DIR__.'/vendor/autoload.php';
\$app = require_once __DIR__.'/bootstrap/app.php';
\$kernel = \$app->make(Illuminate\Contracts\Console\Kernel::class);
\$kernel->bootstrap();
if (\App\Models\User::count() === 0) {
    exit(0);
} else {
    exit(1);
}
"

# Exit code 0 means 0 users.
if [ $? -eq 0 ]; then
    echo "Users table is empty. Running database seeders..."
    php artisan db:seed --force
else
    echo "Users table already has data. Skipping seeders."
fi

echo "Starting application..."
exec "$@"
