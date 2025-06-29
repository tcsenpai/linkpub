# Use Node.js LTS Alpine image for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy application code
COPY . .

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S linkpub -u 1001

# Create epubs directory with correct permissions
RUN mkdir -p /app/epubs && \
    chown -R linkpub:nodejs /app

USER linkpub

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/karakeep/status', (res) => { process.exit(res.statusCode === 200 || res.statusCode === 503 ? 0 : 1) })"

# Start the application
CMD ["npm", "start"]
