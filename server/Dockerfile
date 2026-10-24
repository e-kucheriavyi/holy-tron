FROM node:24-alpine

WORKDIR /app

RUN npm install --global pnpm@12.3.4

COPY package.json ./
COPY pnpm-lock.yaml ./

RUN pnpm install --frozen-lockfile

COPY . .

EXPOSE 2026

CMD ["pnpm", "serve"]
