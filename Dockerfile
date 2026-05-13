FROM node:20 AS build

RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build && npm prune --production

EXPOSE 5222

VOLUME ["/app/data"]

ENV PORT=5222

CMD ["node", "dist/index.js"]
