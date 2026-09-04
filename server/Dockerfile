FROM node:22-alpine3.21
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev glib-dev pkgconfig python3 git

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json package-lock.json ./

RUN npm install -g node-gyp
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm install

# Replace sharp with a no-op stub — server CPU lacks SSE4.2/AVX required by the
# prebuilt libvips binary (SIGILL / "invalid opcode" in libvips-cpp.so otherwise).
# Images upload and serve as originals; no thumbnails or format conversion.
# Cached separately so stub changes don't invalidate the npm install layer.
# sharp 0.35 resolves via package.json "exports" -> dist/index.{cjs,mjs}
# (the old lib/index.js path is dead), and ships its native binary in the
# separate @img/sharp-* packages, which we delete so nothing can load it.
COPY sharp-stub.js /opt/node_modules/sharp/dist/index.cjs
RUN printf "export { default } from './index.cjs';\n" > /opt/node_modules/sharp/dist/index.mjs \
    && rm -rf /opt/node_modules/@img/sharp-libvips-* /opt/node_modules/@img/sharp-linux* /opt/node_modules/@img/sharp-linuxmusl-*

ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app

COPY . .

RUN chown -R node:node /opt/app

USER node

RUN ["npm", "run", "build"]

EXPOSE 1337

CMD ["npm", "run", "start"]
