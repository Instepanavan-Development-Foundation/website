FROM node:22-alpine3.21
# Build tools + system libvips (server CPU lacks SSE4.2/AVX required by prebuilt sharp binaries)
RUN apk update && apk add --no-cache build-base gcc autoconf automake zlib-dev libpng-dev nasm bash vips-dev glib-dev pkgconfig python3 git

ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /opt/
COPY package.json package-lock.json ./

RUN npm install -g node-gyp

# Must be set before npm install so sharp builds from source against system libvips
# (not in a separate rebuild step — that breaks Docker layer caching)
ENV SHARP_FORCE_GLOBAL_LIBVIPS=true
RUN npm config set fetch-retry-maxtimeout 600000 -g && npm install

ENV PATH=/opt/node_modules/.bin:$PATH

WORKDIR /opt/app

COPY . .

RUN chown -R node:node /opt/app

USER node

RUN ["npm", "run", "build"]

EXPOSE 1337

CMD ["npm", "run", "start"]
