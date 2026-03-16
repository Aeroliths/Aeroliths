FROM node:25-alpine

# Install required tools
RUN apk add --no-cache git openssh-client bash curl postgresql-client

WORKDIR /app

# Copy dependency files
COPY package*.json ./
COPY prisma ./prisma/

# Install ALL dependencies (including dev for the build)
RUN npm install --no-package-lock --legacy-peer-deps

# Copy the rest of the code
COPY . .

# Entrypoint script for DB setup at startup
RUN chmod +x docker-entrypoint.sh

# Generate Prisma client (temporary DATABASE_URL required for generation)
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy?schema=public"
RUN npm run prisma:generate

# Build the Nuxt application
RUN npm run build

# Expose port
EXPOSE 3000

# Production environment variables
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Start the Nuxt application in production mode
CMD ["sh", "docker-entrypoint.sh"]
