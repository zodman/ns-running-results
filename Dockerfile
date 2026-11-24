# Stage 1: Build React + Vite frontend
FROM node:22-alpine AS frontend
WORKDIR /build
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html vite.config.js ./
COPY public ./public
COPY src ./src
RUN npm run build

# Stage 2: PocketBase single-binary server serving both /api/* and React static dist/
FROM alpine:3.21
ARG PB_VERSION=0.40.6

RUN apk add --no-cache ca-certificates curl unzip tzdata && \
    curl -fsSL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" -o /tmp/pb.zip && \
    unzip /tmp/pb.zip -d /usr/local/bin/ && \
    chmod +x /usr/local/bin/pocketbase && \
    rm -f /tmp/pb.zip

WORKDIR /app
COPY --from=frontend /build/dist /app/pb_public
COPY pocketbase/pb_migrations /app/pb_migrations
COPY pocketbase/pb_hooks /app/pb_hooks
COPY data/route541_all /app/data/route541_all
COPY data/route541_vargas_matches.json /app/data/route541_vargas_matches.json

VOLUME ["/app/pb_data"]
EXPOSE 8090

CMD ["/usr/local/bin/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/app/pb_data", "--publicDir=/app/pb_public", "--migrationsDir=/app/pb_migrations", "--hooksDir=/app/pb_hooks"]
