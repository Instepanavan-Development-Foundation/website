# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

# Install better-sqlite3 dependencies
RUN apk add --no-cache python3 make g++

COPY package*.json ./
RUN npm install --production

COPY --from=builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p data && chown node:node data

USER node

CMD ["node", "dist/index.js"]
