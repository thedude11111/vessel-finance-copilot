# Use a Node.js base image for building
FROM node:20-alpine AS base

# Set working directory inside the container
WORKDIR /app

# Copy root package.json and pnpm-workspace.yaml
COPY ../package.json ../pnpm-workspace.yaml ./

# Copy shared-types package from monorepo root
COPY ../packages/shared-types/ packages/shared-types/

# Copy server package (current directory) into its place
COPY . packages/server/

# Install pnpm via corepack
RUN npm install -g corepack@0.24.1 && corepack enable

# Install dependencies for the entire monorepo
RUN pnpm install --frozen-lockfile

# Build shared-types first
RUN pnpm --filter shared-types build

# Build the server application
RUN pnpm --filter server build

# --- Production Stage ---
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Copy only necessary files from the base stage
# Copy node_modules from the root install
COPY --from=base /app/node_modules/ ./node_modules/
# Copy built shared-types
COPY --from=base /app/packages/shared-types/dist/ packages/shared-types/dist/
# Copy built server application
COPY --from=base /app/packages/server/dist/ packages/server/dist/
# Copy Prisma schema and package.json for Prisma client generation
COPY --from=base /app/packages/server/prisma/ packages/server/prisma/
COPY --from=base /app/packages/server/package.json packages/server/package.json

# Generate Prisma Client in the production stage
RUN cd packages/server && npx prisma generate --data-proxy

# Expose the port the app runs on
EXPOSE 3001

# Start the server
CMD ["node", "packages/server/dist/index.js"]
