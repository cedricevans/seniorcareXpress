FROM alpine:3.19

# Install required libs
RUN apk add --no-cache ca-certificates wget unzip

# Download PocketBase (linux amd64 for Railway)
ARG PB_VERSION=0.25.4
RUN wget -q https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip \
    -O /tmp/pocketbase.zip && \
    unzip /tmp/pocketbase.zip -d /app && \
    rm /tmp/pocketbase.zip && \
    chmod +x /app/pocketbase

WORKDIR /app

# Copy hooks and migrations
COPY pb_hooks ./pb_hooks

# Copy a safe entrypoint to handle superuser creation at runtime and avoid
# accidentally running seeding that could overwrite a persisted DB.
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# NOTE: we intentionally do NOT copy a committed pb_data snapshot into the image here.
# Committing pb_data into the image causes any runtime changes (users, records)
# to be overwritten every time the image is rebuilt. Instead, persist `pb_data`
# with a mounted volume in your hosting environment (or run the setup/seed
# scripts once after first deploy to create collections).

EXPOSE 8090

# Start PocketBase and auto-create superuser from env vars
CMD ["/bin/sh", "-c", "/app/entrypoint.sh"]
