FROM node:22-alpine3.18
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev git
ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json package-lock.json ./
RUN npm install -g node-gyp
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm install
ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app

COPY . .

RUN chown -R node:node /opt/app

# Build sharp from source against system vips (prebuilt binaries require SSE4.2/AVX)
RUN npm install node-addon-api && npm rebuild --build-from-source sharp


USER node

RUN ["npm", "run", "build"]

EXPOSE 1337

CMD ["npm", "run", "start"]
