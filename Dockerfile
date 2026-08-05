FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN HUSKY=0 npm ci
COPY . .
RUN npm run build:production

FROM nginx:1.27-alpine AS runtime

ENV API_UPSTREAM=http://api-gateway:3000
ENV NGINX_ENVSUBST_FILTER=API_UPSTREAM

COPY docker/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist/osc-web-app/browser/ /usr/share/nginx/html/
COPY docker/runtime-config.json /usr/share/nginx/html/assets/runtime-config.json

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=5 \
  CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1

EXPOSE 80
