# Multi-stage build for WarmConnector application
# Stage 1: Build client
FROM node:20-alpine AS client-builder
WORKDIR /app
COPY package*.json ./
COPY client ./client
COPY shared ./shared
COPY tailwind.config.ts postcss.config.js vite.config.ts ./
RUN npm ci
RUN npm run build

# Stage 2: Build server
FROM node:20-alpine AS server-builder
WORKDIR /app
COPY package*.json ./
COPY server ./server
COPY shared ./shared
COPY --from=client-builder /app/dist ./dist
RUN npm ci --production

# Stage 3: Final production image
FROM node:20-alpine
WORKDIR /app
COPY --from=server-builder /app ./

# Environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/index.js"]