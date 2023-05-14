# syntax=docker/dockerfile:1

FROM node:19-alpine

ENV VITE_ADDRESS=http://localhost:8060
ENV VITE_AUTH_ADDRESS=http://localhost:7765

WORKDIR /app

COPY *.json ./

RUN npm install

COPY *.ts ./

COPY *.html ./

COPY public ./public/

COPY src ./src/

EXPOSE 5173

CMD [ "npm", "run", "hosts"]
