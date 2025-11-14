FROM node:20-alpine

RUN apk add --no-cache openssl

WORKDIR /home/node/app

COPY package*.json ./

RUN npm install

COPY . .

RUN chown -R node:node /home/node/app
USER node

RUN npx prisma generate

CMD ["sh", "-c", "npx prisma db push && npm run dev"]
