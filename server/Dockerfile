# syntax=docker/dockerfile:1
# https://docs.docker.com/reference/dockerfile/

ARG NODE_VERSION=20.12.1
ARG PNPM_VERSION=9.11.0

# Install Node.js
FROM node:${NODE_VERSION}-alpine

# Install pnpm
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@${PNPM_VERSION}

# Copy files, set CWD and user
WORKDIR /home/democracy-lottery
COPY ./server .
RUN chown -R node /home/democracy-lottery
USER node

# Install all dependencies and build
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm run build

# Install production dependencies
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --prod --frozen-lockfile

CMD pnpm start
