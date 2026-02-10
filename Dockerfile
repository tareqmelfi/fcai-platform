FROM node:20-alpine AS builder
WORKDIR /app

ENV NODE_ENV=development

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .
RUN NODE_ENV=production npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/drizzle.config.ts ./
COPY --from=builder /app/shared ./shared

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.cjs"]
