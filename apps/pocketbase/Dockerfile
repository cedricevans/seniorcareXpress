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

# PocketBase data will be in /app/pb_data (Railway volume)
RUN mkdir -p /app/pb_data

EXPOSE 8090

CMD ["/bin/sh", "-c", "/app/pocketbase serve --http=0.0.0.0:${PORT:-8090} --hooksDir=/app/pb_hooks --hooksWatch=false"]
