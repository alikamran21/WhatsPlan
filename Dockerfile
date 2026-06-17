# Verified against this project: npm install (471 packages, all public)
# + npm run dev served a real 200 response on port 8080 with the host
# override in vite.config.ts applied.
FROM node:22-slim

WORKDIR /app

# Install deps first so this layer caches between rebuilds
COPY package.json ./
RUN npm install --no-audit --no-fund

# Now copy the rest of the project (vite.config.ts here already has the
# host: "0.0.0.0" override — without it the dev server crashes in most
# containers with EAFNOSUPPORT trying to bind IPv6 "::")
COPY . .

EXPOSE 8080

CMD ["npm", "run", "dev"]
