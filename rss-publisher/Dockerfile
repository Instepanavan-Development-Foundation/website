# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
# better-sqlite3 ships prebuilt binaries (incl. linuxmusl); skip npm's implicit node-gyp rebuild
RUN npm install --ignore-scripts

COPY . .
RUN npm run build

# Production stage
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --omit=dev --ignore-scripts

COPY --from=builder /app/dist ./dist

# Create data directory for SQLite
RUN mkdir -p data && chown node:node data

USER node

CMD ["node", "dist/index.js"]
