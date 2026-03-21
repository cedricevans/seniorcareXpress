FROM alpine:3.19

# Install ca-certificates for HTTPS
RUN apk add --no-cache ca-certificates wget unzip

# Download PocketBase binary for linux/amd64
ARG PB_VERSION=0.25.4
RUN wget -q https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    && unzip pocketbase_${PB_VERSION}_linux_amd64.zip -d /pb \
    && rm pocketbase_${PB_VERSION}_linux_amd64.zip

# Copy migrations and hooks
COPY pb_migrations /pb/pb_migrations
COPY pb_hooks /pb/pb_hooks

# Persistent data volume
VOLUME /pb/pb_data

EXPOSE 8090

CMD ["/pb/pocketbase", "serve", \
     "--http=0.0.0.0:8090", \
     "--dir=/pb/pb_data", \
     "--migrationsDir=/pb/pb_migrations", \
     "--hooksDir=/pb/pb_hooks", \
     "--hooksWatch=false"]
