# BUILD: the app, then the server and the api/ functions bundled with the packages they import
FROM oven/bun:1.3.14-alpine AS builder

WORKDIR /usr/src/app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . /usr/src/app
RUN bun run build
RUN bun server/build.ts

# RUNTIME: no node_modules. The app's VITE_ variables and the functions' secrets are read from the
# container's environment when it starts, so one image serves every environment.
FROM oven/bun:1.3.14-alpine

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /usr/src/app/dist ./dist
COPY --from=builder /usr/src/app/dist-server ./

# The unprivileged user of the oven/bun image.
USER bun

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-8080}/healthz" || exit 1
CMD ["bun", "server/index.js"]
