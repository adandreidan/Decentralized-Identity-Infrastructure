# ──────────────────────────────────────────────────────────────────────────
# webhook-receiver/Dockerfile
#
# Builds a tiny Node.js/Express app that listens for webhook POSTs from
# ACA-Py and serves a dashboard to view them.
# ──────────────────────────────────────────────────────────────────────────

# Alpine variant of Node = small image, faster builds/pulls.
FROM node:20-alpine

WORKDIR /app

# Copy ONLY the dependency manifests first. Docker caches each instruction
# as a layer — as long as package.json/package-lock.json don't change,
# `npm install` is skipped on rebuilds even if we edit server.js a hundred
# times. This is the single biggest Docker build-speed trick for Node apps.
COPY package*.json ./

# --omit=dev: this is a runtime image, we don't need devDependencies
# (like a test runner) inside the container.
RUN npm install --omit=dev

# Now copy the actual application code.
COPY src/ ./src/

# Informational only — docker-compose.yml's `ports:` does the real mapping.
EXPOSE 3000

# Start the server when the container runs.
CMD ["node", "src/server.js"]
