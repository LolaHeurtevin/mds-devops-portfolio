# Use the official Node.js 18 image as the base image
FROM node:20-alpine AS base

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Use a minimal Node.js image for the production environment
FROM node:20-alpine AS production

# Set the working directory
WORKDIR /app

# Create a non-root user and switch to it
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Copy only the necessary files from the build stage
COPY --from=base /app/package*.json ./
COPY --from=base /app/.next ./.next
COPY --from=base /app/public ./public
COPY --from=base /app/node_modules ./node_modules

# Expose the port the app runs on
EXPOSE 3000

# Enable OpenTelemetry instrumentation for Node.js
ENV NODE_OPTIONS="--require @opentelemetry/auto-instrumentations-node/build/src/instrumentation.js"

# Start the Next.js application
CMD ["npm", "start"]