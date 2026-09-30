FROM node:24-slim AS builder
WORKDIR /app

# Install all dependencies for building
COPY package*.json ./
RUN npm ci

# Build client + server bundles
COPY . .
RUN npm run build

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built server output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations

# Allow overriding the exposed port (Railway injects PORT)
EXPOSE 5000

CMD ["node", "dist/index.js"]
