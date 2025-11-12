# Build stage
FROM node:20.15.0-slim AS builder

# Set the working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install all dependencies (including dev dependencies for build)
# Skip scripts to avoid Playwright installation
RUN pnpm install --frozen-lockfile --ignore-scripts

# Manually run nuxt prepare (needed for build) but skip Playwright
RUN pnpm exec nuxt prepare

# Copy the application files
COPY . .

# Make the migration script executable
RUN chmod +x /app/migrate-and-start.sh

# Build the application
RUN pnpm run build

# Production stage
FROM node:20.15.0-slim AS production

# Set the working directory
WORKDIR /app

# Install pnpm (needed for migrations)
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --prod --frozen-lockfile --ignore-scripts

# Install drizzle-kit for migrations (needed by migrate-and-start.sh)
# Note: This may install some devDependencies, but they're needed for migrations
RUN pnpm add drizzle-kit@^0.31.5 --save-dev --ignore-scripts

# Copy built application from builder stage
COPY --from=builder /app/.output ./.output

# Copy migration script
COPY --from=builder /app/migrate-and-start.sh ./migrate-and-start.sh

# Copy drizzle config and migrations (needed for migrations)
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/server/db ./server/db

# Expose and set port 8080
EXPOSE 8080
ENV NITRO_PORT=8080
ENV NODE_ENV=production

# Use the migration script as the default command
CMD ["./migrate-and-start.sh"]
