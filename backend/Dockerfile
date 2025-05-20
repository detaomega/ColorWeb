FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install
RUN npm install -g nodemon  # 全局安裝 nodemon

COPY . .

EXPOSE 3000

CMD ["sh", "-c", "CHOKIDAR_USEPOLLING=true nodemon --verbose --watch /app --ext js,json,yaml server.js"]