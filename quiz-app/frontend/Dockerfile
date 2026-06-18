# Build stage
FROM node:22-alpine AS build

# Update Alpine packages to latest security patches
# RUN apk update && apk 
RUN apk update && apk upgrade --no-cache
# RUN apk upgrade --no-cache

# Set working directory
WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package*.json ./

# Install exact dependencies from package-lock.json
RUN npm ci

# Copy application source code
COPY . .

# Build optimized production static files
RUN npm run build


# Runtime stage 
FROM nginx:1.27-alpine AS runtime

# Update Alpine packages to latest security patches
# RUN apk update && apk upgrade
RUN apk update && apk upgrade --no-cache
# Remove default Nginx static files
RUN rm -rf /usr/share/nginx/html/*

# Copy built React files into Nginx web root
# COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html

# Expose Nginx port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
