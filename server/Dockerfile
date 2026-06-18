# WhatsPlan backend — Node + system Chromium for whatsapp-web.js (puppeteer).
FROM node:22-slim

# Chromium + the shared libraries puppeteer needs to launch it headless.
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium \
      ca-certificates fonts-liberation \
      libasound2 libatk-bridge2.0-0 libatk1.0-0 libcairo2 libcups2 libdbus-1-3 \
      libdrm2 libexpat1 libgbm1 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 \
      libpango-1.0-0 libx11-6 libxcb1 libxcomposite1 libxdamage1 libxext6 \
      libxfixes3 libxkbcommon0 libxrandr2 wget \
    && rm -rf /var/lib/apt/lists/*

# Use the apt-installed Chromium instead of downloading puppeteer's own copy.
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    NODE_ENV=production

WORKDIR /app

# Install node deps first so this layer caches across rebuilds.
COPY package.json ./
RUN npm install --no-audit --no-fund

COPY . .

# WhatsApp auth session + local file store live here — mount a volume on it.
RUN mkdir -p /app/data

EXPOSE 4000
CMD ["node", "src/index.js"]
