# ==================================
# Multi-stage Dockerfile for React + Vite
# Supports both Development and Production modes
# ==================================

# ============= Base Stage =============
# Common dependencies for both dev and prod
FROM node:20-alpine AS base

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# ============= Development Stage =============
FROM base AS development

# Install ALL dependencies (including devDependencies)
RUN npm ci

# Copy application source code
COPY . .

# Expose Vite dev server port
EXPOSE 5173

# Set environment to development
ENV NODE_ENV=development

# Start Vite dev server with HMR enabled
# --host 0.0.0.0 allows external connections (required for Docker)
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ============= Build Stage =============
# Build optimized production bundle
FROM base AS build

# Install ALL dependencies (needed for build)
RUN npm ci

# Copy application source
COPY . .

# Build the application
RUN npm run build

# ============= Production Stage =============
FROM nginx:alpine AS production

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose nginx port
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost/ || exit 1

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
