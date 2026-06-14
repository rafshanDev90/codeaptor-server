FROM node:22-alpine

WORKDIR /usr/src/app

# Copy package configurations
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy and apply patches (patch-package not in node_modules, so use npx)
COPY patches ./patches
RUN npx -y patch-package

# Copy application source code
COPY . .

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=3000

# Expose server port
EXPOSE 3000

# Start server
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "server.js"]