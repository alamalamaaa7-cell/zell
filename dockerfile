FROM node:20-slim

RUN apt-get update && apt-get install -y libatomic1

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

CMD ["node", "bot.js"]
