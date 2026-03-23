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
COPY pb_migrations ./pb_migrations

# NOTE: pb_data is NOT copied - it must be a mounted persistent volume in Railway
# The entrypoint.sh will create the superuser automatically on first boot

# Copy a safe entrypoint to handle superuser creation at runtime
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

EXPOSE 8090

# Start PocketBase and auto-create superuser from env vars
CMD ["/bin/sh", "-c", "/app/entrypoint.sh"]
