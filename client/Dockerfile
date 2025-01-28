# Dockerfile for nextjs app
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

RUN npm run build

COPY . .

CMD ["npm", "run", "start"]