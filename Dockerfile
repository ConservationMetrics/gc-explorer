# Use the official Node.js image from DockerHub
FROM node:20.15.0-slim

# Set the working directory
RUN mkdir -p /app
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json and package-lock.json into the container
COPY package*.json pnpm-lock.yaml  /app/

# Install dependencies
RUN pnpm install

# Copy the application files into the container
COPY . /app

# Make the migration script executable
RUN chmod +x /app/migrate-and-start.sh

# Build the application
RUN pnpm run build

# Expose and set port 8080
EXPOSE 8080
ENV NITRO_PORT=8080

# Use the migration script as the default command
CMD ["/app/migrate-and-start.sh"]
