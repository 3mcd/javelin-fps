# 1: Dev
FROM node:12-alpine as builder

WORKDIR /app

# Install bash dependency
RUN apk add --no-cache bash

# Add manifest
ADD package.json package.json
ADD yarn.lock yarn.lock

# Install dev and project dependencies
RUN yarn

# Add source code
ADD client ./client
ADD common ./common

# Build
RUN yarn build:client

# 2: NGINX
FROM nginx:alpine

# nginx config
RUN rm -rf /etc/nginx/conf.d
COPY ./conf/nginx.conf /etc/nginx/

COPY --from=builder /app/client/dist /usr/share/nginx/html

WORKDIR /usr/share/nginx/html

COPY client/.env.example .env
COPY client/bin/build_env_config.sh .

# Add bash
RUN apk add --no-cache bash
RUN chmod +x ./build_env_config.sh
RUN ls /usr/share/nginx/html
# RUN chmod -R 755 /usr/share/nginx/html/assets

CMD ["/bin/bash", "-c", "/usr/share/nginx/html/build_env_config.sh && nginx -g \"daemon off;\""]
