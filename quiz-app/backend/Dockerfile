# # Use current LTS Node.js on lightweight Alpine base
# FROM node:22-alpine AS base

# # Update Alpine packages to latest security patches
# # RUN apk update && apk upgrade
# RUN apk update && apk upgrade --no-cache

# # Install ca certificate
# RUN apk add --no-cache ca-certificates

# # Set production environment
# ENV NODE_ENV=production

# # Create app directory
# WORKDIR /usr/src/app


# # Dependencies stage 
# FROM base AS deps

# # Copy only package files first to leverage Docker cache
# COPY package*.json ./

# # Install only production dependencies using package-lock.json
# RUN npm ci --omit=dev


# # Runtime stage 
# FROM base AS runtime

# # Run app as non-root user already provided by official node image
# USER node

# # Copy installed dependencies from deps stage
# COPY --chown=node:node --from=deps /usr/src/app/node_modules ./node_modules

# # Copy package files
# COPY --chown=node:node package*.json ./

# # Copy application source code
# COPY --chown=node:node . .

# # Document app port
# EXPOSE 3000

# # Start backend
# CMD ["npm", "run", "start"]

FROM node:22-alpine AS base

RUN apk update && apk upgrade --no-cache
RUN apk add --no-cache ca-certificates

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
RUN chown -R node:node /usr/src/app

USER node

EXPOSE 3000

CMD ["npm", "run", "start"]