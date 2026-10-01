FROM node:24-slim AS builder
WORKDIR /app

# Install all dependencies for building
COPY package*.json ./
RUN npm ci

# Build client + server bundles
COPY . .
RUN npm run build
RUN node scripts/prefetch-segmentation.mjs

FROM node:24-slim AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built server output
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/.model-cache ./.model-cache
COPY --from=builder /app/scripts/segment-foreground.mjs ./scripts/segment-foreground.mjs
COPY --from=builder /app/scripts/furniture-model.mjs ./scripts/furniture-model.mjs
COPY --from=builder /app/licenses ./licenses

# Allow overriding the exposed port (Railway injects PORT)
EXPOSE 5000

CMD ["node", "dist/index.js"]
