FROM node:20-slim
RUN apt-get update && apt-get install -y libatomic1
WORKDIR /app

COPY package.json ./
RUN echo "=== ISI FOLDER SEBELUM NPM ===" && ls -la
RUN npm install
RUN echo "=== ISI FOLDER SETELAH NPM ===" && ls -la

COPY . .
CMD ["node", "bot.js"]
