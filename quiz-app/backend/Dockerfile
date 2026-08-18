FROM node:22-alpine AS base

RUN apk update && apk upgrade --no-cache
RUN apk add --no-cache ca-certificates

# RUN npm install -g npm@latest

# RUN npm install -g undici@latest

ENV NODE_ENV=production
WORKDIR /usr/src/app


FROM base AS deps

# COPY package*.json ./
COPY package.json package-lock.json ./
RUN npm ci --omit=dev


FROM base AS runtime

COPY --from=deps /usr/src/app/node_modules ./node_modules
COPY package.json ./

COPY . .

RUN rm -f package-lock.json

RUN rm -rf /usr/local/lib/node_modules/npm \
    /usr/local/bin/npm \
    /usr/local/bin/npx

RUN chown -R node:node /usr/src/app

USER node

EXPOSE 3000

# CMD ["npm", "index.js"]
CMD ["node", "index.js"]