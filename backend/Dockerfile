# Stage: Production 
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (layer caching)
COPY --chown=node:node package*.json ./
RUN npm ci --omit=dev

# Copy source
COPY --chown=node:node . .

# Switch to non-root user (security best practice)
USER node

# Expose backend port
EXPOSE 1234

# Start the server
CMD ["node", "app.js"]
