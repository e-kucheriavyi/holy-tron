FROM node:24-alpine

WORKDIR /app

RUN npm install --global pnpm@12.3.4

COPY package.json ./

RUN pnpm install

COPY . .

EXPOSE 2026

CMD ["pnpm", "serve"]
