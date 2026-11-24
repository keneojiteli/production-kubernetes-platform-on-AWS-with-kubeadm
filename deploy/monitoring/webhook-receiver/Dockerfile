# Stage 1: Install production dependencies
FROM node:24-alpine3.22 AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


# Stage 2: Minimal Node.js runtime
FROM alpine:3.22

RUN apk upgrade --no-cache \
    && apk add --no-cache libstdc++ ca-certificates \
    && addgroup -S node \
    && adduser -S -G node node

WORKDIR /app

COPY --from=build /usr/local/bin/node /usr/local/bin/node
COPY --from=build /app/node_modules ./node_modules
COPY server.js ./

ENV NODE_ENV=production

USER node

EXPOSE 8080

CMD ["node", "server.js"]