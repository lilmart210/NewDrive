# syntax=docker/dockerfile:1

FROM node:19-alpine


ENV ACCESS_TOKEN_SECRET="SPIININ ON YOU"
ENV REFRESH_TOKEN_SECRET="WHERE THE PROBLEM AT"
ENV NEW_ORIGIN='localhost:5173'


WORKDIR /server

COPY package*.json ./

RUN mkdir database

RUN npm install


COPY *.js ./

EXPOSE 8060 7765

CMD ["npm", "run", "conc"]