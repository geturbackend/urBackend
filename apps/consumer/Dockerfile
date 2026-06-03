FROM node:22-alpine

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json ./

# Copy workspace package.json files
COPY packages/common/package.json ./packages/common/
COPY apps/consumer/package.json ./apps/consumer/

RUN npm ci

# Copy actual source code
COPY packages/common ./packages/common
COPY apps/consumer ./apps/consumer

WORKDIR /app/apps/consumer

CMD ["npm", "run", "start"]