# 1: Dev
FROM node:12

WORKDIR /app

# Add manifest
ADD package.json package.json
ADD yarn.lock yarn.lock

# Install dev and project dependencies
RUN yarn

# Add source code
ADD server ./server
ADD common ./common

# Build
RUN yarn build:server

EXPOSE 3000/tcp
EXPOSE 0-65535/udp

CMD node ./server/dist/server/src/index.js
