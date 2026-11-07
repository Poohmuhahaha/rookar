# Stage 1: Build the Vue 3 + Vite application
FROM oven/bun:1-alpine AS builder

WORKDIR /app

RUN apk add --no-cache nodejs

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build

# Stage 2: Serve with lightweight Caddy server
FROM caddy:2-alpine

COPY --from=builder /app/dist /usr/share/caddy
COPY Caddyfile /etc/caddy/Caddyfile

EXPOSE 80

CMD ["caddy", "run", "--config", "/etc/caddy/Caddyfile", "--adapter", "caddyfile"]
