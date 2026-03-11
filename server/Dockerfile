FROM node:22-alpine3.21
# Installing libvips-dev for sharp Compatibility
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev glib-dev pkgconfig python3 git
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

# Force sharp to use system libvips (prebuilt binaries require SSE4.2/AVX)
ENV SHARP_FORCE_GLOBAL_LIBVIPS=true
RUN rm -rf /opt/node_modules/@img/sharp-* && \
    cd /opt && npm install node-addon-api node-gyp && \
    npm rebuild --build-from-source sharp


USER node

RUN ["npm", "run", "build"]

EXPOSE 1337

CMD ["npm", "run", "start"]
