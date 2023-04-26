FROM node:16

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install -g nodemon dotenv

RUN npm install

COPY . .

EXPOSE 8080

EXPOSE 80

CMD [ "nodemon", "-L", "server.js" ]
