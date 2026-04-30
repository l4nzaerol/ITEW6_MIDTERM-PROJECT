FROM php:8.2-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    libzip-dev \
    default-mysql-client

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory to app root
WORKDIR /app

# Copy all project files
COPY . .

# Change into the backend directory
WORKDIR /app/backend

# Install PHP dependencies
RUN composer install --no-interaction --optimize-autoloader

# Copy and setup entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Expose the default artisan serve port
EXPOSE 8000

# Set the entrypoint
ENTRYPOINT ["docker-entrypoint.sh"]

# Set the default command
CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
