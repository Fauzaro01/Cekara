FROM php:8.4-cli-alpine

# Install system dependencies & PHP extensions
RUN apk add --no-cache \
    git \
    curl \
    libpng-dev \
    libxml2-dev \
    zip \
    unzip \
    sqlite-dev \
    nodejs \
    npm

RUN docker-php-ext-install pdo pdo_sqlite pcntl bcmath

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app

# Copy dependency definitions
COPY composer.json composer.lock package.json package-lock.json ./

# Install dependencies
RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
RUN npm ci

# Copy application files
COPY . .

# Build frontend production assets
RUN npm run build

# Setup permissions
RUN chown -R www-data:www-data storage bootstrap/cache

EXPOSE 8000

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]

