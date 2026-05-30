FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_APP_NAME="Odds X-Ray"
ARG VITE_PRODUCT_LAYER="The Ox"
ARG VITE_BUILD_ID="OX-001"
ARG VITE_FORGE_API_BASE="https://forge.oddsxray.com"

ENV VITE_APP_NAME=$VITE_APP_NAME
ENV VITE_PRODUCT_LAYER=$VITE_PRODUCT_LAYER
ENV VITE_BUILD_ID=$VITE_BUILD_ID
ENV VITE_FORGE_API_BASE=$VITE_FORGE_API_BASE

RUN npm run build


FROM node:20-alpine AS runtime

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY server.js ./server.js

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["node", "server.js"]