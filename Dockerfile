FROM node:24-bookworm-slim
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js seed.js ./
COPY config ./config
COPY models ./models
COPY routes ./routes
ENV NODE_ENV=production
USER node
EXPOSE 3000
CMD ["node", "server.js"]
