FROM node:20-alpine@sha256:fb4cd12c85ee03686f6af5362a0b0d56d50c58a04632e6c0fb8363f609372293 AS build

WORKDIR /app
RUN apk add --no-cache python3
COPY package.json package-lock.json .npmrc ./
COPY scripts/security/check_npm_supply_chain.py ./scripts/security/check_npm_supply_chain.py
COPY security/npm-malware-blocklist.csv security/npm-lifecycle-allowlist.json ./security/
RUN python3 scripts/security/check_npm_supply_chain.py --repo . --offline-reviewed --skip-installed \
    && npm ci --ignore-scripts --no-audit --fund=false \
    && npm audit signatures \
    && npm rebuild @parcel/watcher@2.5.6 esbuild@0.25.12 esbuild@0.28.1 lmdb@3.4.2 msgpackr-extract@3.0.4 --ignore-scripts=false \
    && python3 scripts/security/check_npm_supply_chain.py --repo . --offline-reviewed
COPY . .
RUN npm run build:production

FROM nginx:1.27-alpine@sha256:65645c7bb6a0661892a8b03b89d0743208a18dd2f3f17a54ef4b76fb8e2f2a10 AS runtime

ENV API_UPSTREAM=http://api-gateway:3000
ENV WEBAPP_API_BASE_URL=/api/v1
ENV DEMO_MODE=false
ENV NGINX_ENVSUBST_FILTER=API_UPSTREAM

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/osc-web-app/browser/ /usr/share/nginx/html/
COPY docker/runtime-config.json.template /opt/osc/runtime-config.json.template
COPY docker/40-runtime-config.sh /docker-entrypoint.d/40-runtime-config.sh
RUN chmod 0555 /docker-entrypoint.d/40-runtime-config.sh

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

EXPOSE 80
